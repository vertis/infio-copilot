import * as path from 'path'

import { useMutation } from '@tanstack/react-query'
import { CircleStop, History, Plus } from 'lucide-react'
import { App, Notice } from 'obsidian'
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react'
import { v4 as uuidv4 } from 'uuid'

import { ApplyViewState } from '../../ApplyView'
import { APPLY_VIEW_TYPE } from '../../constants'
import { useApp } from '../../contexts/AppContext'
import { useDiffStrategy } from '../../contexts/DiffStrategyContext'
import { useLLM } from '../../contexts/LLMContext'
import { useRAG } from '../../contexts/RAGContext'
import { useSettings } from '../../contexts/SettingsContext'
import {
	LLMAPIKeyInvalidException,
	LLMAPIKeyNotSetException,
	LLMBaseUrlNotSetException,
	LLMModelNotSetException,
} from '../../core/llm/exception'
import { regexSearchFiles } from '../../core/ripgrep'
import { useChatHistory } from '../../hooks/use-chat-history'
import { ApplyStatus, ToolArgs } from '../../types/apply'
import { ChatMessage, ChatUserMessage } from '../../types/chat'
import {
	MentionableBlock,
	MentionableBlockData,
	MentionableCurrentFile,
} from '../../types/mentionable'
import { ApplyEditToFile, SearchAndReplace } from '../../utils/apply'
import { listFilesAndFolders } from '../../utils/glob-utils'
import {
	getMentionableKey,
	serializeMentionable,
} from '../../utils/mentionable'
import { readTFileContent } from '../../utils/obsidian'
import { openSettingsModalWithError } from '../../utils/open-settings-modal'
import { PromptGenerator, addLineNumbers } from '../../utils/prompt-generator'
import { fetchUrlsContent, webSearch } from '../../utils/web-search'

// Simple file reading function that returns a placeholder content for testing
const readFileContent = async (app: App, filePath: string): Promise<string> => {
	const file = app.vault.getFileByPath(filePath)
	if (!file) {
		throw new Error(`File not found: ${filePath}`)
	}
	return await readTFileContent(file, app.vault)
}

import { ModeSelect } from './chat-input/ModeSelect'
import PromptInputWithActions, { ChatUserInputRef } from './chat-input/PromptInputWithActions'
import { editorStateToPlainText } from './chat-input/utils/editor-state-to-plain-text'
import { ChatHistory } from './ChatHistory'
import MarkdownReasoningBlock from './MarkdownReasoningBlock'
import QueryProgress, { QueryProgressState } from './QueryProgress'
import ReactMarkdown from './ReactMarkdown'
import ShortcutInfo from './ShortcutInfo'
import SimilaritySearchResults from './SimilaritySearchResults'

// Add an empty line here
const getNewInputMessage = (app: App): ChatUserMessage => {
	return {
		role: 'user',
		applyStatus: ApplyStatus.Idle,
		content: null,
		promptContent: null,
		id: uuidv4(),
		mentionables: [
			{
				type: 'current-file',
				file: app.workspace.getActiveFile(),
			},
		],
	}
}

export type ChatRef = {
	openNewChat: (selectedBlock?: MentionableBlockData) => void
	addSelectionToChat: (selectedBlock: MentionableBlockData) => void
	focusMessage: () => void
}

export type ChatProps = {
	selectedBlock?: MentionableBlockData
}

const Chat = forwardRef<ChatRef, ChatProps>((props, ref) => {
	const app = useApp()
	const { settings, setSettings } = useSettings()
	const { getRAGEngine } = useRAG()
	const diffStrategy = useDiffStrategy()

	const {
		createOrUpdateConversation,
		deleteConversation,
		getChatMessagesById,
		updateConversationTitle,
		chatList,
	} = useChatHistory()
	const { streamResponse, chatModel } = useLLM()

	const promptGenerator = useMemo(() => {
		return new PromptGenerator(getRAGEngine, app, settings, diffStrategy)
	}, [getRAGEngine, app, settings, diffStrategy])

	const [inputMessage, setInputMessage] = useState<ChatUserMessage>(() => {
		const newMessage = getNewInputMessage(app)
		if (props.selectedBlock) {
			newMessage.mentionables = [
				...newMessage.mentionables,
				{
					type: 'block',
					...props.selectedBlock,
				},
			]
		}
		return newMessage
	})
	const [addedBlockKey, setAddedBlockKey] = useState<string | null>(
		props.selectedBlock
			? getMentionableKey(
				serializeMentionable({
					type: 'block',
					...props.selectedBlock,
				}),
			)
			: null,
	)
	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
	const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null)
	const [currentConversationId, setCurrentConversationId] =
		useState<string>(uuidv4())
	const [queryProgress, setQueryProgress] = useState<QueryProgressState>({
		type: 'idle',
	})

	const preventAutoScrollRef = useRef(false)
	const lastProgrammaticScrollRef = useRef<number>(0)
	const activeStreamAbortControllersRef = useRef<AbortController[]>([])
	const chatUserInputRefs = useRef<Map<string, ChatUserInputRef>>(new Map())
	const chatMessagesRef = useRef<HTMLDivElement>(null)
	const registerChatUserInputRef = (
		id: string,
		ref: ChatUserInputRef | null,
	) => {
		if (ref) {
			chatUserInputRefs.current.set(id, ref)
		} else {
			chatUserInputRefs.current.delete(id)
		}
	}

	useEffect(() => {
		const scrollContainer = chatMessagesRef.current
		if (!scrollContainer) return

		const handleScroll = () => {
			// If the scroll event happened very close to our programmatic scroll, ignore it
			if (Date.now() - lastProgrammaticScrollRef.current < 50) {
				return
			}

			preventAutoScrollRef.current =
				scrollContainer.scrollHeight -
				scrollContainer.scrollTop -
				scrollContainer.clientHeight >
				20
		}

		scrollContainer.addEventListener('scroll', handleScroll)
		return () => scrollContainer.removeEventListener('scroll', handleScroll)
	}, [chatMessages])

	const handleScrollToBottom = () => {
		if (chatMessagesRef.current) {
			const scrollContainer = chatMessagesRef.current
			if (scrollContainer.scrollTop !== scrollContainer.scrollHeight) {
				lastProgrammaticScrollRef.current = Date.now()
				scrollContainer.scrollTop = scrollContainer.scrollHeight
			}
		}
	}

	const abortActiveStreams = () => {
		for (const abortController of activeStreamAbortControllersRef.current) {
			abortController.abort()
		}
		activeStreamAbortControllersRef.current = []
	}

	const handleLoadConversation = async (conversationId: string) => {
		try {
			abortActiveStreams()
			const conversation = await getChatMessagesById(conversationId)
			if (!conversation) {
				throw new Error('Conversation not found')
			}
			setCurrentConversationId(conversationId)
			setChatMessages(conversation)
			const newInputMessage = getNewInputMessage(app)
			setInputMessage(newInputMessage)
			setFocusedMessageId(newInputMessage.id)
			setQueryProgress({
				type: 'idle',
			})
		} catch (error) {
			new Notice('Failed to load conversation')
			console.error('Failed to load conversation', error)
		}
	}

	const handleNewChat = (selectedBlock?: MentionableBlockData) => {
		setCurrentConversationId(uuidv4())
		setChatMessages([])
		const newInputMessage = getNewInputMessage(app)
		if (selectedBlock) {
			const mentionableBlock: MentionableBlock = {
				type: 'block',
				...selectedBlock,
			}
			newInputMessage.mentionables = [
				...newInputMessage.mentionables,
				mentionableBlock,
			]
			setAddedBlockKey(
				getMentionableKey(serializeMentionable(mentionableBlock)),
			)
		}
		setInputMessage(newInputMessage)
		setFocusedMessageId(newInputMessage.id)
		setQueryProgress({
			type: 'idle',
		})
		abortActiveStreams()
	}

	const submitMutation = useMutation({
		mutationFn: async ({
			newChatHistory,
			useVaultSearch,
		}: {
			newChatHistory: ChatMessage[]
			useVaultSearch?: boolean
		}) => {
			abortActiveStreams()
			setQueryProgress({
				type: 'idle',
			})

			const responseMessageId = uuidv4()

			try {
				const abortController = new AbortController()
				activeStreamAbortControllersRef.current.push(abortController)

				const { requestMessages, compiledMessages } =
					await promptGenerator.generateRequestMessages({
						messages: newChatHistory,
						useVaultSearch,
						onQueryProgressChange: setQueryProgress,
					})
				setQueryProgress({
					type: 'idle',
				})

				setChatMessages([
					...compiledMessages,
					{
						role: 'assistant',
						applyStatus: ApplyStatus.Idle,
						content: '',
						reasoningContent: '',
						id: responseMessageId,
						metadata: {
							usage: undefined,
							model: undefined,
						},
					},
				])
				const stream = await streamResponse(
					chatModel,
					{
						model: chatModel.modelId,
						temperature: 0,
						messages: requestMessages,
						stream: true,
					},
					{
						signal: abortController.signal,
					},
				)

				for await (const chunk of stream) {
					const content = chunk.choices[0]?.delta?.content ?? ''
					const reasoning_content = chunk.choices[0]?.delta?.reasoning_content ?? ''
					setChatMessages((prevChatHistory) =>
						prevChatHistory.map((message) =>
							message.role === 'assistant' && message.id === responseMessageId
								? {
									...message,
									content: message.content + content,
									reasoningContent: message.reasoningContent + reasoning_content,
									metadata: {
										...message.metadata,
										usage: chunk.usage ?? message.metadata?.usage, // Keep existing usage if chunk has no usage data
										model: chatModel,
									},
								}
								: message,
						),
					)
					if (!preventAutoScrollRef.current) {
						handleScrollToBottom()
					}
				}
			} catch (error) {
				if (error.name === 'AbortError') {
					return
				} else {
					throw error
				}
			}
		},
		onError: (error) => {
			setQueryProgress({
				type: 'idle',
			})
			if (
				error instanceof LLMAPIKeyNotSetException ||
				error instanceof LLMAPIKeyInvalidException ||
				error instanceof LLMBaseUrlNotSetException ||
				error instanceof LLMModelNotSetException
			) {
				openSettingsModalWithError(app, error.message)
			} else {
				new Notice(error.message)
				console.error('Failed to generate response', error)
			}
		},
	})

	const handleSubmit = (
		newChatHistory: ChatMessage[],
		useVaultSearch?: boolean,
	) => {
		submitMutation.mutate({ newChatHistory, useVaultSearch })
	}

	const applyMutation = useMutation<
		{
			type: string;
			applyMsgId: string;
			applyStatus: ApplyStatus;
			returnMsg?: ChatUserMessage
		},
		Error,
		{ applyMsgId: string, toolArgs: ToolArgs }
	>({
		mutationFn: async ({ applyMsgId, toolArgs }) => {
			try {
				const activeFile = app.workspace.getActiveFile()
				if (!activeFile) {
					throw new Error(
						'No file is currently open to apply changes. Please open a file and try again.',
					)
				}

				const activeFileContent = await readTFileContent(activeFile, app.vault)

				if (toolArgs.type === 'write_to_file' || toolArgs.type === 'insert_content') {
					const applyRes = await ApplyEditToFile(
						activeFile,
						activeFileContent,
						toolArgs.content,
						toolArgs.startLine,
						toolArgs.endLine
					)
					if (!applyRes) {
						throw new Error('Failed to apply edit changes')
					}
					// return a Promise, which will be resolved after user makes a choice
					return new Promise<{ type: string; applyMsgId: string; applyStatus: ApplyStatus; returnMsg?: ChatUserMessage }>((resolve) => {
						app.workspace.getLeaf(true).setViewState({
							type: APPLY_VIEW_TYPE,
							active: true,
							state: {
								file: activeFile,
								originalContent: activeFileContent,
								newContent: applyRes,
								onClose: (applied: boolean) => {
									const applyStatus = applied ? ApplyStatus.Applied : ApplyStatus.Rejected
									const applyEditContent = applied ? 'Changes successfully applied'
										: 'User rejected changes'
									resolve({
										type: 'write_to_file',
										applyMsgId,
										applyStatus,
										returnMsg: {
											role: 'user',
											applyStatus: ApplyStatus.Idle,
											content: null,
											promptContent: `[write_to_file for '${toolArgs.filepath}'] Result:\n${applyEditContent}\n`,
											id: uuidv4(),
											mentionables: [],
										}
									});
								}
							} satisfies ApplyViewState,
						})
					})
				} else if (toolArgs.type === 'search_and_replace') {
					const fileContent = activeFile.path === toolArgs.filepath ? activeFileContent : await readFileContent(app, toolArgs.filepath)
					const applyRes = await SearchAndReplace(
						activeFile,
						fileContent,
						toolArgs.operations
					)
					if (!applyRes) {
						throw new Error('Failed to search_and_replace')
					}
					// return a Promise, which will be resolved after user makes a choice
					return new Promise<{ type: string; applyMsgId: string; applyStatus: ApplyStatus; returnMsg?: ChatUserMessage }>((resolve) => {
						app.workspace.getLeaf(true).setViewState({
							type: APPLY_VIEW_TYPE,
							active: true,
							state: {
								file: activeFile,
								originalContent: activeFileContent,
								newContent: applyRes,
								onClose: (applied: boolean) => {
									const applyStatus = applied ? ApplyStatus.Applied : ApplyStatus.Rejected
									const applyEditContent = applied ? 'Changes successfully applied'
										: 'User rejected changes'
									resolve({
										type: 'search_and_replace',
										applyMsgId,
										applyStatus,
										returnMsg: {
											role: 'user',
											applyStatus: ApplyStatus.Idle,
											content: null,
											promptContent: `[search_and_replace for '${toolArgs.filepath}'] Result:\n${applyEditContent}\n`,
											id: uuidv4(),
											mentionables: [],
										}
									});
								}
							} satisfies ApplyViewState,
						})
					})
				} else if (toolArgs.type === 'apply_diff') {
					const diffResult = await diffStrategy.applyDiff(
						activeFileContent,
						toolArgs.diff
					)
					if (!diffResult.success) {
						console.log(diffResult)
						throw new Error(`Failed to apply_diff`)
					}
					// return a Promise, which will be resolved after user makes a choice
					return new Promise<{ type: string; applyMsgId: string; applyStatus: ApplyStatus; returnMsg?: ChatUserMessage }>((resolve) => {
						app.workspace.getLeaf(true).setViewState({
							type: APPLY_VIEW_TYPE,
							active: true,
							state: {
								file: activeFile,
								originalContent: activeFileContent,
								newContent: diffResult.content,
								onClose: (applied: boolean) => {
									const applyStatus = applied ? ApplyStatus.Applied : ApplyStatus.Rejected
									const applyEditContent = applied ? 'Changes successfully applied'
										: 'User rejected changes'
									resolve({
										type: 'apply_diff',
										applyMsgId,
										applyStatus,
										returnMsg: {
											role: 'user',
											applyStatus: ApplyStatus.Idle,
											content: null,
											promptContent: `[apply_diff for '${toolArgs.filepath}'] Result:\n${applyEditContent}\n`,
											id: uuidv4(),
											mentionables: [],
										}
									});
								}
							} satisfies ApplyViewState,
						})
					})
				} else if (toolArgs.type === 'read_file') {
					const fileContent = await readFileContent(app, toolArgs.filepath)
					const formattedContent = `[read_file for '${toolArgs.filepath}'] Result:\n${addLineNumbers(fileContent)}\n`;
					return {
						type: 'read_file',
						applyMsgId,
						applyStatus: ApplyStatus.Applied,
						returnMsg: {
							role: 'user',
							applyStatus: ApplyStatus.Idle,
							content: null,
							promptContent: formattedContent,
							id: uuidv4(),
							mentionables: [],
						}
					};
				} else if (toolArgs.type === 'list_files') {
					const files = await listFilesAndFolders(app.vault, toolArgs.filepath)
					const formattedContent = `[list_files for '${toolArgs.filepath}'] Result:\n${files.join('\n')}\n`;
					return {
						type: 'list_files',
						applyMsgId,
						applyStatus: ApplyStatus.Applied,
						returnMsg: {
							role: 'user',
							applyStatus: ApplyStatus.Idle,
							content: null,
							promptContent: formattedContent,
							id: uuidv4(),
							mentionables: [],
						}
					}
				} else if (toolArgs.type === 'regex_search_files') {
					const baseVaultPath = app.vault.adapter.getBasePath()
					const ripgrepPath = settings.ripgrepPath
					const absolutePath = path.join(baseVaultPath, toolArgs.filepath)
					const results = await regexSearchFiles(absolutePath, toolArgs.regex, ripgrepPath)
					const formattedContent = `[regex_search_files for '${toolArgs.filepath}'] Result:\n${results}\n`;
					return {
						type: 'regex_search_files',
						applyMsgId,
						applyStatus: ApplyStatus.Applied,
						returnMsg: {
							role: 'user',
							applyStatus: ApplyStatus.Idle,
							content: null,
							promptContent: formattedContent,
							id: uuidv4(),
							mentionables: [],
						}
					}
				} else if (toolArgs.type === 'semantic_search_files') {
					const scope_folders = toolArgs.filepath
						&& toolArgs.filepath !== ''
						&& toolArgs.filepath !== '.'
						&& toolArgs.filepath !== '/'
						? { files: [], folders: [toolArgs.filepath] }
						: undefined
					const results = await (await getRAGEngine()).processQuery({
						query: toolArgs.query,
						scope: scope_folders,
					})
					console.log("results", results)
					let snippets = results.map(({ path, content, metadata }) => {
						const contentWithLineNumbers = addLineNumbers(content, metadata.startLine)
						return `<file_block_content location="${path}#L${metadata.startLine}-${metadata.endLine}">\n${contentWithLineNumbers}\n</file_block_content>`
					}).join('\n\n')
					if (snippets.length === 0) {
						snippets = `No results found for '${toolArgs.query}'`
					}
					const formattedContent = `[semantic_search_files for '${toolArgs.filepath}'] Result:\n${snippets}\n`;
					return {
						type: 'semantic_search_files',
						applyMsgId,
						applyStatus: ApplyStatus.Applied,
						returnMsg: {
							role: 'user',
							applyStatus: ApplyStatus.Idle,
							content: null,
							promptContent: formattedContent,
							id: uuidv4(),
							mentionables: [],
						}
					}
				} else if (toolArgs.type === 'search_web') {
					const results = await webSearch(
						toolArgs.query,
						settings.serperApiKey,
						settings.serperSearchEngine,
						settings.jinaApiKey,
						(await getRAGEngine())
					)
					const formattedContent = `[search_web for '${toolArgs.query}'] Result:\n${results}\n`;
					return {
						type: 'search_web',
						applyMsgId,
						applyStatus: ApplyStatus.Applied,
						returnMsg: {
							role: 'user',
							applyStatus: ApplyStatus.Idle,
							content: null,
							promptContent: formattedContent,
							id: uuidv4(),
							mentionables: [],
						}
					}
				} else if (toolArgs.type === 'fetch_urls_content') {
					const results = await fetchUrlsContent(toolArgs.urls, settings.jinaApiKey)
					const formattedContent = `[ fetch_urls_content ] Result:\n${results}\n`;
					return {
						type: 'fetch_urls_content',
						applyMsgId,
						applyStatus: ApplyStatus.Applied,
						returnMsg: {
							role: 'user',
							applyStatus: ApplyStatus.Idle,
							content: null,
							promptContent: formattedContent,
							id: uuidv4(),
							mentionables: [],
						}
					}
				} else if (toolArgs.type === 'switch_mode') {
					setSettings({
						...settings,
						mode: toolArgs.mode,
					})
					const formattedContent = `[switch_mode to ${toolArgs.mode}] Result: successfully switched to ${toolArgs.mode}\n`
					return {
						type: 'switch_mode',
						applyMsgId,
						applyStatus: ApplyStatus.Applied,
						returnMsg: {
							role: 'user',
							applyStatus: ApplyStatus.Idle,
							content: null,
							promptContent: formattedContent,
							id: uuidv4(),
							mentionables: [],
						}
					}
				}
			} catch (error) {
				console.error('Failed to apply changes', error)
				throw error
			}
		},
		onSuccess: (result) => {
			if (result.applyMsgId || result.returnMsg) {
				let newChatMessages = [...chatMessages];

				if (result.applyMsgId) {
					newChatMessages = newChatMessages.map((message) =>
						message.role === 'assistant' && message.id === result.applyMsgId ? {
							...message,
							applyStatus: result.applyStatus
						} : message,
					);
				}
				setChatMessages(newChatMessages);

				if (result.returnMsg) {
					handleSubmit([...newChatMessages, result.returnMsg], false);
				}
			}
		},
		onError: (error) => {
			if (
				error instanceof LLMAPIKeyNotSetException ||
				error instanceof LLMAPIKeyInvalidException ||
				error instanceof LLMBaseUrlNotSetException ||
				error instanceof LLMModelNotSetException
			) {
				openSettingsModalWithError(app, error.message)
			} else {
				new Notice(error.message)
				console.error('Failed to apply changes', error)
			}
		},
	})

	const handleApply = useCallback(
		(applyMsgId: string, toolArgs: ToolArgs) => {
			applyMutation.mutate({ applyMsgId, toolArgs })
		},
		[applyMutation],
	)

	useEffect(() => {
		setFocusedMessageId(inputMessage.id)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		const updateConversationAsync = async () => {
			try {
				if (chatMessages.length > 0) {
					createOrUpdateConversation(currentConversationId, chatMessages)
				}
			} catch (error) {
				new Notice('Failed to save chat history')
				console.error('Failed to save chat history', error)
			}
		}
		updateConversationAsync()
	}, [currentConversationId, chatMessages, createOrUpdateConversation])

	// Updates the currentFile of the focused message (input or chat history)
	// This happens when active file changes or focused message changes
	const handleActiveLeafChange = useCallback(() => {
		const activeFile = app.workspace.getActiveFile()
		if (!activeFile) return

		const mentionable: Omit<MentionableCurrentFile, 'id'> = {
			type: 'current-file',
			file: activeFile,
		}

		if (!focusedMessageId) return
		if (inputMessage.id === focusedMessageId) {
			setInputMessage((prevInputMessage) => ({
				...prevInputMessage,
				mentionables: [
					mentionable,
					...prevInputMessage.mentionables.filter(
						(mentionable) => mentionable.type !== 'current-file',
					),
				],
			}))
		} else {
			setChatMessages((prevChatHistory) =>
				prevChatHistory.map((message) =>
					message.id === focusedMessageId && message.role === 'user'
						? {
							...message,
							mentionables: [
								mentionable,
								...message.mentionables.filter(
									(mentionable) => mentionable.type !== 'current-file',
								),
							],
						}
						: message,
				),
			)
		}
	}, [app.workspace, focusedMessageId, inputMessage.id])

	useEffect(() => {
		app.workspace.on('active-leaf-change', handleActiveLeafChange)
		return () => {
			app.workspace.off('active-leaf-change', handleActiveLeafChange)
		}
	}, [app.workspace, handleActiveLeafChange])

	useImperativeHandle(ref, () => ({
		openNewChat: (selectedBlock?: MentionableBlockData) =>
			handleNewChat(selectedBlock),
		addSelectionToChat: (selectedBlock: MentionableBlockData) => {
			const mentionable: Omit<MentionableBlock, 'id'> = {
				type: 'block',
				...selectedBlock,
			}

			setAddedBlockKey(getMentionableKey(serializeMentionable(mentionable)))

			if (focusedMessageId === inputMessage.id) {
				setInputMessage((prevInputMessage) => {
					const mentionableKey = getMentionableKey(
						serializeMentionable(mentionable),
					)
					// Check if mentionable already exists
					if (
						prevInputMessage.mentionables.some(
							(m) =>
								getMentionableKey(serializeMentionable(m)) === mentionableKey,
						)
					) {
						return prevInputMessage
					}
					return {
						...prevInputMessage,
						mentionables: [...prevInputMessage.mentionables, mentionable],
					}
				})
			} else {
				setChatMessages((prevChatHistory) =>
					prevChatHistory.map((message) => {
						if (message.id === focusedMessageId && message.role === 'user') {
							const mentionableKey = getMentionableKey(
								serializeMentionable(mentionable),
							)
							// Check if mentionable already exists
							if (
								message.mentionables.some(
									(m) =>
										getMentionableKey(serializeMentionable(m)) ===
										mentionableKey,
								)
							) {
								return message
							}
							return {
								...message,
								mentionables: [...message.mentionables, mentionable],
							}
						}
						return message
					}),
				)
			}
		},
		focusMessage: () => {
			if (!focusedMessageId) return
			chatUserInputRefs.current.get(focusedMessageId)?.focus()
		},
	}))

	return (
		<div className="infio-chat-container">
			<div className="infio-chat-header">
				<ModeSelect />
				<div className="infio-chat-header-buttons">
					<button
						onClick={() => handleNewChat()}
						className="infio-chat-list-dropdown"
					>
						<Plus size={18} />
					</button>
					<ChatHistory
						chatList={chatList}
						currentConversationId={currentConversationId}
						onSelect={async (conversationId) => {
							if (conversationId === currentConversationId) return
							await handleLoadConversation(conversationId)
						}}
						onDelete={async (conversationId) => {
							await deleteConversation(conversationId)
							if (conversationId === currentConversationId) {
								const nextConversation = chatList.find(
									(chat) => chat.id !== conversationId,
								)
								if (nextConversation) {
									void handleLoadConversation(nextConversation.id)
								} else {
									handleNewChat()
								}
							}
						}}
						onUpdateTitle={async (conversationId, newTitle) => {
							await updateConversationTitle(conversationId, newTitle)
						}}
						className="infio-chat-list-dropdown"
					>
						<History size={18} />
					</ChatHistory>
				</div>
			</div>
			<div className="infio-chat-messages" ref={chatMessagesRef}>
				{
					// If the chat is empty, show a message to start a new chat
					chatMessages.length === 0 && (
						<div className="infio-chat-empty-state">
							<ShortcutInfo />
						</div>
					)
				}
				{chatMessages.map((message, index) =>
					message.role === 'user' ? (
						message.content &&
						<div key={"user-" + message.id} className="infio-chat-messages-user">
							<PromptInputWithActions
								key={"input-" + message.id}
								ref={(ref) => registerChatUserInputRef(message.id, ref)}
								initialSerializedEditorState={message.content}
								onSubmit={(content, useVaultSearch) => {
									if (editorStateToPlainText(content).trim() === '') return
									handleSubmit(
										[
											...chatMessages.slice(0, index),
											{
												role: 'user',
												applyStatus: ApplyStatus.Idle,
												content: content,
												promptContent: null,
												id: message.id,
												mentionables: message.mentionables,
											},
										],
										useVaultSearch,
									)
									chatUserInputRefs.current.get(inputMessage.id)?.focus()
								}}
								onFocus={() => {
									setFocusedMessageId(message.id)
								}}
								mentionables={message.mentionables}
								setMentionables={(mentionables) => {
									setChatMessages((prevChatHistory) =>
										prevChatHistory.map((msg) =>
											msg.id === message.id ? { ...msg, mentionables } : msg,
										),
									)
								}}
							/>
							{message.similaritySearchResults && (
								<SimilaritySearchResults
									key={"similarity-search-" + message.id}
									similaritySearchResults={message.similaritySearchResults}
								/>
							)}
						</div>
					) : (
						<div key={"assistant-" + message.id} className="infio-chat-messages-assistant">
							<MarkdownReasoningBlock
								key={"reasoning-" + message.id}
								reasoningContent={message.reasoningContent} />
							<ReactMarkdownItem
								key={"content-" + message.id}
								handleApply={(toolArgs) => handleApply(message.id, toolArgs)}
								applyStatus={message.applyStatus}
							>
								{message.content}
							</ReactMarkdownItem>
						</div>
					),
				)}
				<QueryProgress state={queryProgress} />
				{submitMutation.isPending && (
					<button onClick={abortActiveStreams} className="infio-stop-gen-btn">
						<CircleStop size={16} />
						<div>Stop generation</div>
					</button>
				)}
			</div>
			<PromptInputWithActions
				key={inputMessage.id}
				ref={(ref) => registerChatUserInputRef(inputMessage.id, ref)}
				initialSerializedEditorState={inputMessage.content}
				onSubmit={(content, useVaultSearch) => {
					if (editorStateToPlainText(content).trim() === '') return
					handleSubmit(
						[...chatMessages, { ...inputMessage, content }],
						useVaultSearch,
					)
					setInputMessage(getNewInputMessage(app))
					preventAutoScrollRef.current = false
					handleScrollToBottom()
				}}
				onFocus={() => {
					setFocusedMessageId(inputMessage.id)
				}}
				mentionables={inputMessage.mentionables}
				setMentionables={(mentionables) => {
					setInputMessage((prevInputMessage) => ({
						...prevInputMessage,
						mentionables,
					}))
				}}
				autoFocus
				addedBlockKey={addedBlockKey}
			/>
		</div>
	)
})

function ReactMarkdownItem({
	handleApply,
	applyStatus,
	// applyMutation,
	children,
}: {
	handleApply: (toolArgs: ToolArgs) => void
	applyStatus: ApplyStatus
	children: string
}) {
	return (
		<ReactMarkdown
			applyStatus={applyStatus}
			onApply={handleApply}
		>
			{children}
		</ReactMarkdown>
	)
}

Chat.displayName = 'Chat'

export default Chat
