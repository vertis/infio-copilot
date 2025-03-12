// @ts-nocheck
import { EditorView } from '@codemirror/view'
import { Editor, MarkdownView, Notice, Plugin, TFile } from 'obsidian'

import { ApplyView } from './ApplyView'
import { ChatView } from './ChatView'
import { ChatProps } from './components/chat-view/Chat'
import { APPLY_VIEW_TYPE, CHAT_VIEW_TYPE } from './constants'
import { InlineEdit } from './core/edit/inline-edit-processor'
import { RAGEngine } from './core/rag/rag-engine'
import { DBManager } from './database/database-manager'
import EventListener from "./event-listener"
import CompletionKeyWatcher from "./render-plugin/completion-key-watcher"
import DocumentChangesListener, {
	DocumentChanges,
	getPrefix, getSuffix,
	hasMultipleCursors,
	hasSelection
} from "./render-plugin/document-changes-listener"
import RenderSuggestionPlugin from "./render-plugin/render-surgestion-plugin"
import { InlineSuggestionState } from "./render-plugin/states"
import { InfioSettingTab } from './settings/SettingTab'
import StatusBar from "./status-bar"
import {
	InfioSettings,
	parseInfioSettings,
} from './types/settings'
import './utils/path'
import { getMentionableBlockData } from './utils/obsidian'

// Remember to rename these classes and interfaces!
export default class InfioPlugin extends Plugin {
	settings: InfioSettings
	settingTab: InfioSettingTab
	settingsListeners: ((newSettings: InfioSettings) => void)[] = []
	private activeLeafChangeUnloadFn: (() => void) | null = null
	private metadataCacheUnloadFn: (() => void) | null = null
	initChatProps?: ChatProps
	dbManager: DBManager | null = null
	ragEngine: RAGEngine | null = null
	inlineEdit: InlineEdit | null = null
	private dbManagerInitPromise: Promise<DBManager> | null = null
	private ragEngineInitPromise: Promise<RAGEngine> | null = null

	async onload() {
		await this.loadSettings()

		// Add settings tab
		this.settingTab = new InfioSettingTab(this.app, this)
		this.addSettingTab(this.settingTab)

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('wand-sparkles', 'Open infio copilot', () =>
			this.openChatView(),
		)

		this.registerView(CHAT_VIEW_TYPE, (leaf) => new ChatView(leaf, this))
		this.registerView(APPLY_VIEW_TYPE, (leaf) => new ApplyView(leaf))

		// Register markdown processor for ai blocks
		this.inlineEdit = new InlineEdit(this, this.settings);
		this.registerMarkdownCodeBlockProcessor("infioedit", (source, el, ctx) => {
			this.inlineEdit?.Processor(source, el, ctx);
		});

		// Update inlineEdit when settings change
		this.addSettingsListener((newSettings) => {
			this.inlineEdit = new InlineEdit(this, newSettings);
		});

		// Setup event listener
		const statusBar = StatusBar.fromApp(this);
		const eventListener = EventListener.fromSettings(
			this.settings,
			statusBar,
			this.app
		);
		this.addSettingsListener((newSettings) => {
			eventListener.handleSettingChanged(newSettings)
		});

		// Setup render plugin
		this.registerEditorExtension([
			InlineSuggestionState,
			CompletionKeyWatcher(
				eventListener.handleAcceptKeyPressed.bind(eventListener) as () => boolean,
				eventListener.handlePartialAcceptKeyPressed.bind(eventListener) as () => boolean,
				eventListener.handleCancelKeyPressed.bind(eventListener) as () => boolean,
			),
			DocumentChangesListener(
				eventListener.handleDocumentChange.bind(eventListener) as (documentChange: DocumentChanges) => Promise<void>
			),
			RenderSuggestionPlugin(),
		]);

		this.app.workspace.onLayoutReady(() => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);

			if (view) {
				// @ts-expect-error, not typed
				const editorView = view.editor.cm as EditorView;
				eventListener.onViewUpdate(editorView);
			}
		});

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				if (leaf?.view instanceof MarkdownView) {
					// @ts-expect-error, not typed
					const editorView = leaf.view.editor.cm as EditorView;
					eventListener.onViewUpdate(editorView);
					if (leaf.view.file) {
						eventListener.handleFileChange(leaf.view.file);
					}
				}
			})
		);

		this.registerEvent(
			this.app.metadataCache.on("changed", (file: TFile) => {
				if (file) {
					eventListener.handleFileChange(file);
				}
			})
		);

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-new-chat',
			name: 'Open new chat',
			callback: () => this.openChatView(true),
		})

		this.addCommand({
			id: 'add-selection-to-chat',
			name: 'Add selection to chat',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.addSelectionToChat(editor, view)
			},
			// hotkeys: [
			// 	{
			// 		modifiers: ['Mod', 'Shift'],
			// 		key: 'l',
			// 	},
			// ],
		})

		this.addCommand({
			id: 'rebuild-vault-index',
			name: 'Rebuild entire vault index',
			callback: async () => {
				const notice = new Notice('Rebuilding vault index...', 0)
				try {
					const ragEngine = await this.getRAGEngine()
					await ragEngine.updateVaultIndex(
						{ reindexAll: true },
						(queryProgress) => {
							if (queryProgress.type === 'indexing') {
								const { completedChunks, totalChunks } =
									queryProgress.indexProgress
								notice.setMessage(
									`Indexing chunks: ${completedChunks} / ${totalChunks}`,
								)
							}
						},
					)
					notice.setMessage('Rebuilding vault index complete')
				} catch (error) {
					console.error(error)
					notice.setMessage('Rebuilding vault index failed')
				} finally {
					setTimeout(() => {
						notice.hide()
					}, 1000)
				}
			},
		})

		this.addCommand({
			id: 'update-vault-index',
			name: 'Update index for modified files',
			callback: async () => {
				const notice = new Notice('Updating vault index...', 0)
				try {
					const ragEngine = await this.getRAGEngine()
					await ragEngine.updateVaultIndex(
						{ reindexAll: false },
						(queryProgress) => {
							if (queryProgress.type === 'indexing') {
								const { completedChunks, totalChunks } =
									queryProgress.indexProgress
								notice.setMessage(
									`Indexing chunks: ${completedChunks} / ${totalChunks}`,
								)
							}
						},
					)
					notice.setMessage('Vault index updated')
				} catch (error) {
					console.error(error)
					notice.setMessage('Vault index update failed')
				} finally {
					setTimeout(() => {
						notice.hide()
					}, 1000)
				}
			},
		})

		this.addCommand({
			id: 'autocomplete-accept',
			name: 'Autocomplete accept',
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: MarkdownView
			) => {
				if (checking) {
					return (
						eventListener.isSuggesting()
					);
				}

				eventListener.handleAcceptCommand();

				return true;
			},
		})

		this.addCommand({
			id: 'autocomplete-predict',
			name: 'Autocomplete predict',
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: MarkdownView
			) => {
				// @ts-expect-error, not typed
				const editorView = editor.cm as EditorView;
				const state = editorView.state;
				if (checking) {
					return eventListener.isIdle() && !hasMultipleCursors(state) && !hasSelection(state);
				}

				const prefix = getPrefix(state)
				const suffix = getSuffix(state)

				eventListener.handlePredictCommand(prefix, suffix);
				return true;
			},
		});

		this.addCommand({
			id: "autocomplete-toggle",
			name: "Autocomplete toggle",
			callback: () => {
				const newValue = !this.settings.autocompleteEnabled;
				this.setSettings({
					...this.settings,
					autocompleteEnabled: newValue,
				})
			},
		});

		this.addCommand({
			id: "autocomplete-enable",
			name: "Autocomplete enable",
			checkCallback: (checking) => {
				if (checking) {
					return !this.settings.autocompleteEnabled;
				}

				this.setSettings({
					...this.settings,
					autocompleteEnabled: true,
				})
				return true;
			},
		});

		this.addCommand({
			id: "autocomplete-disable",
			name: "Autocomplete disable",
			checkCallback: (checking) => {
				if (checking) {
					return this.settings.autocompleteEnabled;
				}

				this.setSettings({
					...this.settings,
					autocompleteEnabled: false,
				})
				return true;
			},
		});

		this.addCommand({
			id: "ai-inline-edit",
			name: "Inline edit",
			// hotkeys: [
			// 	{
			// 		modifiers: ['Mod', 'Shift'],
			// 		key: "k",
			// 	},
			// ],
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection();
				if (!selection) {
					new Notice("Please select some text first");
					return;
				}
				// Get the selection start position
				const from = editor.getCursor("from");
				// Create the position for inserting the block
				const insertPos = { line: from.line, ch: 0 };
				// Create the AI block with the selected text
				const customBlock = "```infioedit\n```\n";
				// Insert the block above the selection
				editor.replaceRange(customBlock, insertPos);
			},
		});
	}

	onunload() {
		this.dbManager?.cleanup()
		this.dbManager = null
	}

	async loadSettings() {
		this.settings = parseInfioSettings(await this.loadData())
		await this.saveData(this.settings) // Save updated settings
	}

	async setSettings(newSettings: InfioSettings) {
		this.settings = newSettings
		await this.saveData(newSettings)
		this.ragEngine?.setSettings(newSettings)
		this.settingsListeners.forEach((listener) => listener(newSettings))
	}

	addSettingsListener(
		listener: (newSettings: InfioSettings) => void,
	) {
		this.settingsListeners.push(listener)
		return () => {
			this.settingsListeners = this.settingsListeners.filter(
				(l) => l !== listener,
			)
		}
	}

	async openChatView(openNewChat = false) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView)
		const editor = view?.editor
		if (!view || !editor) {
			this.activateChatView(undefined, openNewChat)
			return
		}
		const selectedBlockData = await getMentionableBlockData(editor, view)
		this.activateChatView(
			{
				selectedBlock: selectedBlockData ?? undefined,
			},
			openNewChat,
		)
	}

	async activateChatView(chatProps?: ChatProps, openNewChat = false) {
		// chatProps is consumed in ChatView.tsx
		this.initChatProps = chatProps

		const leaf = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]

		await (leaf ?? this.app.workspace.getRightLeaf(false))?.setViewState({
			type: CHAT_VIEW_TYPE,
			active: true,
		})

		if (openNewChat && leaf && leaf.view instanceof ChatView) {
			leaf.view.openNewChat(chatProps?.selectedBlock)
		}

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0],
		)
	}

	async addSelectionToChat(editor: Editor, view: MarkdownView) {
		const data = await getMentionableBlockData(editor, view)
		if (!data) return

		const leaves = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)
		if (leaves.length === 0 || !(leaves[0].view instanceof ChatView)) {
			await this.activateChatView({
				selectedBlock: data,
			})
			return
		}

		// bring leaf to foreground (uncollapse sidebar if it's collapsed)
		await this.app.workspace.revealLeaf(leaves[0])

		const chatView = leaves[0].view
		chatView.addSelectionToChat(data)
		chatView.focusMessage()
	}

	async getDbManager(): Promise<DBManager> {
		if (this.dbManager) {
			return this.dbManager
		}

		if (!this.dbManagerInitPromise) {
			this.dbManagerInitPromise = (async () => {
				this.dbManager = await DBManager.create(this.app)
				return this.dbManager
			})()
		}

		// if initialization is running, wait for it to complete instead of creating a new initialization promise
		return this.dbManagerInitPromise
	}

	async getRAGEngine(): Promise<RAGEngine> {
		if (this.ragEngine) {
			return this.ragEngine
		}

		if (!this.ragEngineInitPromise) {
			this.ragEngineInitPromise = (async () => {
				const dbManager = await this.getDbManager()
				this.ragEngine = new RAGEngine(this.app, this.settings, dbManager)
				return this.ragEngine
			})()
		}

		// if initialization is running, wait for it to complete instead of creating a new initialization promise
		return this.ragEngineInitPromise
	}
}
