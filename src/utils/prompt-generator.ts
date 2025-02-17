import { App, TFile, htmlToMarkdown, requestUrl } from 'obsidian'

import { editorStateToPlainText } from '../components/chat-view/chat-input/utils/editor-state-to-plain-text'
import { QueryProgressState } from '../components/chat-view/QueryProgress'
import { RAGEngine } from '../core/rag/rag-engine'
import { SelectVector } from '../database/schema'
import { ChatMessage, ChatUserMessage } from '../types/chat'
import { ContentPart, RequestMessage } from '../types/llm/request'
import {
	MentionableBlock, MentionableCurrentFile, MentionableFile,
	MentionableFolder,
	MentionableImage,
	MentionableUrl,
	MentionableVault
} from '../types/mentionable'
import { InfioSettings } from '../types/settings'

import {
	getNestedFiles,
	readMultipleTFiles,
	readTFileContent,
} from './obsidian'
import { tokenCount } from './token'
import { YoutubeTranscript, isYoutubeUrl } from './youtube-transcript'

export class PromptGenerator {
	private getRagEngine: () => Promise<RAGEngine>
	private app: App
	private settings: InfioSettings

	constructor(
		getRagEngine: () => Promise<RAGEngine>,
		app: App,
		settings: InfioSettings,
	) {
		this.getRagEngine = getRagEngine
		this.app = app
		this.settings = settings
	}

	public async generateRequestMessages({
		messages,
		useVaultSearch,
		onQueryProgressChange,
		type,
	}: {
		messages: ChatMessage[]
		useVaultSearch?: boolean
		onQueryProgressChange?: (queryProgress: QueryProgressState) => void
		type?: string
	}): Promise<{
		requestMessages: RequestMessage[]
		compiledMessages: ChatMessage[]
	}> {
		if (messages.length === 0) {
			throw new Error('No messages provided')
		}
		const lastUserMessage = messages[messages.length - 1]
		if (lastUserMessage.role !== 'user') {
			throw new Error('Last message is not a user message')
		}

		const { promptContent, shouldUseRAG, similaritySearchResults } =
			await this.compileUserMessagePrompt({
				message: lastUserMessage,
				useVaultSearch,
				onQueryProgressChange,
			})
		let compiledMessages = [
			...messages.slice(0, -1),
			{
				...lastUserMessage,
				promptContent,
				similaritySearchResults,
			},
		]

		// Safeguard: ensure all user messages have parsed content
		compiledMessages = await Promise.all(
			compiledMessages.map(async (message) => {
				if (message.role === 'user' && !message.promptContent) {
					const { promptContent, similaritySearchResults } =
						await this.compileUserMessagePrompt({
							message,
						})
					return {
						...message,
						promptContent,
						similaritySearchResults,
					}
				}
				return message
			}),
		)

		const systemMessage = this.getSystemMessage(shouldUseRAG, type)

		const customInstructionMessage = this.getCustomInstructionMessage()

		const currentFile = lastUserMessage.mentionables.find(
			(m): m is MentionableCurrentFile => m.type === 'current-file',
		)?.file
		const currentFileMessage = currentFile
			? await this.getCurrentFileMessage(currentFile)
			: undefined

		const requestMessages: RequestMessage[] = [
			systemMessage,
			...(customInstructionMessage ? [customInstructionMessage] : []),
			...(currentFileMessage ? [currentFileMessage] : []),
			...compiledMessages.slice(-20).map((message): RequestMessage => {
				if (message.role === 'user') {
					return {
						role: 'user',
						content: message.promptContent ?? '',
					}
				} else {
					return {
						role: 'assistant',
						content: message.content,
					}
				}
			}),
			...(shouldUseRAG ? [this.getRagInstructionMessage()] : []),
		]

		return {
			requestMessages,
			compiledMessages,
		}
	}

	private async compileUserMessagePrompt({
		message,
		useVaultSearch,
		onQueryProgressChange,
	}: {
		message: ChatUserMessage
		useVaultSearch?: boolean
		onQueryProgressChange?: (queryProgress: QueryProgressState) => void
	}): Promise<{
		promptContent: ChatUserMessage['promptContent']
		shouldUseRAG: boolean
		similaritySearchResults?: (Omit<SelectVector, 'embedding'> & {
			similarity: number
		})[]
	}> {
		if (!message.content) {
			return {
				promptContent: '',
				shouldUseRAG: false,
			}
		}
		const query = editorStateToPlainText(message.content)
		let similaritySearchResults = undefined

		useVaultSearch =
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			useVaultSearch ||
			message.mentionables.some(
				(m): m is MentionableVault => m.type === 'vault',
			)

		onQueryProgressChange?.({
			type: 'reading-mentionables',
		})
		const files = message.mentionables
			.filter((m): m is MentionableFile => m.type === 'file')
			.map((m) => m.file)
		const folders = message.mentionables
			.filter((m): m is MentionableFolder => m.type === 'folder')
			.map((m) => m.folder)
		const nestedFiles = folders.flatMap((folder) =>
			getNestedFiles(folder, this.app.vault),
		)
		const allFiles = [...files, ...nestedFiles]
		const fileContents = await readMultipleTFiles(allFiles, this.app.vault)

		// Count tokens incrementally to avoid long processing times on large content sets
		const exceedsTokenThreshold = async () => {
			let accTokenCount = 0
			for (const content of fileContents) {
				const count = await tokenCount(content)
				accTokenCount += count
				if (accTokenCount > this.settings.ragOptions.thresholdTokens) {
					return true
				}
			}
			return false
		}
		const shouldUseRAG = useVaultSearch || (await exceedsTokenThreshold())

		let filePrompt: string
		if (shouldUseRAG) {
			similaritySearchResults = useVaultSearch
				? await (
					await this.getRagEngine()
				).processQuery({
					query,
					onQueryProgressChange: onQueryProgressChange,
				}) // TODO: Add similarity boosting for mentioned files or folders
				: await (
					await this.getRagEngine()
				).processQuery({
					query,
					scope: {
						files: files.map((f) => f.path),
						folders: folders.map((f) => f.path),
					},
					onQueryProgressChange: onQueryProgressChange,
				})
			filePrompt = `## Potentially relevant snippets from the current vault
${similaritySearchResults
					.map(({ path, content, metadata }) => {
						const contentWithLineNumbers = this.addLineNumbersToContent({
							content,
							startLine: metadata.startLine,
						})
						return `\`\`\`${path}\n${contentWithLineNumbers}\n\`\`\`\n`
					})
					.join('')}\n`
		} else {
			filePrompt = allFiles
				.map((file, index) => {
					return `\`\`\`${file.path}\n${fileContents[index]}\n\`\`\`\n`
				})
				.join('')
		}

		const blocks = message.mentionables.filter(
			(m): m is MentionableBlock => m.type === 'block',
		)
		const blockPrompt = blocks
			.map(({ file, content, startLine, endLine }) => {
				return `\`\`\`${file.path}#L${startLine}-${endLine}\n${content}\n\`\`\`\n`
			})
			.join('')

		const urls = message.mentionables.filter(
			(m): m is MentionableUrl => m.type === 'url',
		)

		const urlPrompt =
			urls.length > 0
				? `## Potentially relevant web search results
${(
					await Promise.all(
						urls.map(
							async ({ url }) => `\`\`\`
Website URL: ${url}
Website Content:
${await this.getWebsiteContent(url)}
\`\`\``,
						),
					)
				).join('\n')}
`
				: ''

		const imageDataUrls = message.mentionables
			.filter((m): m is MentionableImage => m.type === 'image')
			.map(({ data }) => data)

		return {
			promptContent: [
				...imageDataUrls.map(
					(data): ContentPart => ({
						type: 'image_url',
						image_url: {
							url: data,
						},
					}),
				),
				{
					type: 'text',
					text: `${filePrompt}${blockPrompt}${urlPrompt}\n\n${query}\n\n`,
				},
			],
			shouldUseRAG,
			similaritySearchResults: similaritySearchResults,
		}
	}

	private getSystemMessage(shouldUseRAG: boolean, type?: string): RequestMessage {
		const systemPromptEdit = `You are an intelligent assistant to help edit text content based on user instructions. You will be given the current text content and the user's instruction for how to modify it.

1. Your response should contain the modified text content wrapped in <infio_block> tags with appropriate attributes:
   <infio_block filename="path/to/file.md" language="markdown" startLine="10" endLine="20" type="edit">
   [modified content here]
   </infio_block>

2. Preserve the original formatting, indentation and line breaks unless specifically instructed otherwise.

3. Make minimal changes necessary to fulfill the user's instruction. Do not modify parts of the text that don't need to change.

4. If the instruction is unclear or cannot be fulfilled, respond with "ERROR: " followed by a brief explanation.`

		const systemPrompt = `You are an intelligent assistant to help answer any questions that the user has, particularly about editing and organizing markdown files in Obsidian.

1. Please keep your response as concise as possible. Avoid being verbose.

2. When the user is asking for edits to their markdown, please provide a simplified version of the markdown block emphasizing only the changes. Use comments to show where unchanged content has been skipped. Wrap the markdown block with <infio_block> tags. Add filename, language, startLine, endLine and type attributes to the <infio_block> tags. If the user provides line numbers in the file path (e.g. file.md#L10-20), use those line numbers in the startLine and endLine attributes. For example:
<infio_block filename="path/to/file.md" language="markdown" startLine="10" endLine="20" type="edit">
<!-- ... existing content ... -->
{{ edit_1 }}
<!-- ... existing content ... -->
{{ edit_2 }}
<!-- ... existing content ... -->
</infio_block>
The user has full access to the file, so they prefer seeing only the changes in the markdown. Often this will mean that the start/end of the file will be skipped, but that's okay! Rewrite the entire file only if specifically requested. Always provide a brief explanation of the updates, except when the user specifically asks for just the content.

3. Do not lie or make up facts.

4. Respond in the same language as the user's message.

5. Format your response in markdown.

6. When writing out new markdown blocks, also wrap them with <infio_block> tags. For example:
<infio_block language="markdown" type="new">
{{ content }}
</infio_block>

7. When providing markdown blocks for an existing file, add the filename and language attributes to the <infio_block> tags. Restate the relevant section or heading, so the user knows which part of the file you are editing. For example:
<infio_block filename="path/to/file.md" language="markdown" type="reference">
## Section Title
...
{{ content }}
...
</infio_block>`

		const systemPromptRAG = `You are an intelligent assistant to help answer any questions that the user has, particularly about editing and organizing markdown files in Obsidian. You will be given your conversation history with them and potentially relevant blocks of markdown content from the current vault.
      
1. Do not lie or make up facts.

2. Respond in the same language as the user's message.

3. Format your response in markdown.

4. When referencing markdown blocks in your answer, keep the following guidelines in mind:

  a. Never include line numbers in the output markdown.

  b. Wrap the markdown block with <infio_block> tags. Include language attribute and type. For example:
  <infio_block language="markdown" type="new">
  {{ content }}
  </infio_block>

  c. When providing markdown blocks for an existing file, also include the filename attribute to the <infio_block> tags. For example:
  <infio_block filename="path/to/file.md" language="markdown" type="reference">
  {{ content }}
  </infio_block>

  d. When referencing a markdown block the user gives you, add the startLine and endLine attributes to the <infio_block> tags. Write related content outside of the <infio_block> tags. The content inside the <infio_block> tags will be ignored and replaced with the actual content of the markdown block. For example:
  <infio_block filename="path/to/file.md" language="markdown" startLine="2" endLine="30" type="reference"></infio_block>`

		if (type === 'edit') {
			return {
				role: 'system',
				content: systemPromptEdit,
			}
		}

		return {
			role: 'system',
			content: shouldUseRAG ? systemPromptRAG : systemPrompt,
		}
	}

	private getCustomInstructionMessage(): RequestMessage | null {
		const customInstruction = this.settings.systemPrompt.trim()
		if (!customInstruction) {
			return null
		}
		return {
			role: 'user',
			content: `Here are additional instructions to follow in your responses when relevant. There's no need to explicitly acknowledge them:
<custom_instructions>
${customInstruction}
</custom_instructions>`,
		}
	}

	private async getCurrentFileMessage(
		currentFile: TFile,
	): Promise<RequestMessage> {
		const fileContent = await readTFileContent(currentFile, this.app.vault)
		return {
			role: 'user',
			content: `# Inputs
## Current file
Here is the file I'm looking at.
\`\`\`${currentFile.path}
${fileContent}
\`\`\`\n\n`,
		}
	}

	public async generateEditMessages({
		currentFile,
		selectedContent,
		instruction,
		startLine,
		endLine,
	}: {
		currentFile: TFile
		selectedContent: string
		instruction: string
		startLine: number
		endLine: number
	}): Promise<RequestMessage[]> {
		const systemMessage = this.getSystemMessage(false, 'edit')
		const currentFileMessage = await this.getCurrentFileMessage(currentFile)
		const userMessage: RequestMessage = {
			role: 'user',
			content: `Selected text (lines ${startLine}-${endLine}):\n${selectedContent}\n\nInstruction:\n${instruction}`,
		}

		return [systemMessage, currentFileMessage, userMessage]
	}

	private getRagInstructionMessage(): RequestMessage {
		return {
			role: 'user',
			content: `If you need to reference any of the markdown blocks I gave you, add the startLine and endLine attributes to the <infio_block> tags without any content inside. For example:
<infio_block filename="path/to/file.md" language="markdown" startLine="200" endLine="310" type="reference"></infio_block>

When writing out new markdown blocks, remember not to include "line_number|" at the beginning of each line.`,
		}
	}

	private addLineNumbersToContent({
		content,
		startLine,
	}: {
		content: string
		startLine: number
	}): string {
		const lines = content.split('\n')
		const linesWithNumbers = lines.map((line, index) => {
			return `${startLine + index}|${line}`
		})
		return linesWithNumbers.join('\n')
	}

	/**
	 * TODO: Improve markdown conversion logic
	 * - filter visually hidden elements
	 * ...
	 */
	private async getWebsiteContent(url: string): Promise<string> {
		if (isYoutubeUrl(url)) {
			// TODO: pass language based on user preferences
			const { title, transcript } =
				await YoutubeTranscript.fetchTranscriptAndMetadata(url)

			return `Title: ${title}
Video Transcript:
${transcript.map((t) => `${t.offset}: ${t.text}`).join('\n')}`
		}

		const response = await requestUrl({ url })

		return htmlToMarkdown(response.text)
	}
}
