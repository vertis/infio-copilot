import {
	App,
	Modal,
	Notice,
	PluginSettingTab,
	Setting,
	TFile
} from 'obsidian';
import * as React from "react";
import { createRoot } from "react-dom/client";

import InfioPlugin from '../main';
import { InfioSettings } from '../types/settings';
import { findFilesMatchingPatterns } from '../utils/glob-utils';

import AdvancedSettings from './components/AdvancedSettings';
import BasicAutoCompleteSettings from './components/BasicAutoCompleteSettings';
import DangerZoneSettings from './components/DangerZoneSettings';
import ModelParametersSettings from './components/ModelParametersSettings';
import CustomProviderSettings from './components/ModelProviderSettings';
import PostprocessingSettings from './components/PostprocessingSettings';
import PreprocessingSettings from './components/PreprocessingSettings';
import PrivacySettings from './components/PrivacySettings';
import TriggerSettingsSection from './components/TriggerSettingsSection';

export class InfioSettingTab extends PluginSettingTab {
	plugin: InfioPlugin;
	private autoCompleteContainer: HTMLElement | null = null;
	private modelsContainer: HTMLElement | null = null;

	constructor(app: App, plugin: InfioPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this
		containerEl.empty()
		this.renderModelsSection(containerEl)
		this.renderRAGSection(containerEl)
		this.renderAutoCompleteSection(containerEl)
	}

	private renderModelsContent(containerEl: HTMLElement): void {
		const div = containerEl.createDiv("div");
		const sections = createRoot(div);
		sections.render(
			<CustomProviderSettings
				plugin={this.plugin}
				onSettingsUpdate={() => {
					if (this.modelsContainer) {
						this.modelsContainer.empty();
						this.renderModelsContent(this.modelsContainer);
					}
				}}
			/>
		);
	}

	renderModelsSection(containerEl: HTMLElement): void {
		const modelsDiv = containerEl.createDiv("models-section");
		this.modelsContainer = modelsDiv;
		this.renderModelsContent(modelsDiv);
	}

	renderRAGSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setHeading().setName('RAG')
		new Setting(containerEl)
			.setName('Include patterns')
			.setDesc(
				'If any patterns are specified, ONLY files matching at least one pattern will be included in indexing. One pattern per line. Uses glob patterns (e.g., "notes/*", "*.md"). Leave empty to include all files not excluded by exclude patterns. After changing this, use the command "Rebuild entire vault index" to apply changes.',
			)
			.addButton((button) =>
				button.setButtonText('Test patterns').onClick(async () => {
					const patterns = this.plugin.settings.ragOptions.includePatterns
					const includedFiles = await findFilesMatchingPatterns(
						patterns,
						this.plugin.app.vault,
					)
					new IncludedFilesModal(this.app, includedFiles, patterns).open()
				}),
			)
		new Setting(containerEl)
			.setClass('infio-chat-settings-textarea')
			.addTextArea((text) =>
				text
					.setValue(this.plugin.settings.ragOptions.includePatterns.join('\n'))
					.onChange(async (value) => {
						const patterns = value
							.split('\n')
							.map((p) => p.trim())
							.filter((p) => p.length > 0)
						await this.plugin.setSettings({
							...this.plugin.settings,
							ragOptions: {
								...this.plugin.settings.ragOptions,
								includePatterns: patterns,
							},
						})
					}),
			)

		new Setting(containerEl)
			.setName('Exclude patterns')
			.setDesc(
				'Files matching ANY of these patterns will be excluded from indexing. One pattern per line. Uses glob patterns (e.g., "private/*", "*.tmp"). Leave empty to exclude nothing. After changing this, use the command "Rebuild entire vault index" to apply changes.',
			)
			.addButton((button) =>
				button.setButtonText('Test patterns').onClick(async () => {
					const patterns = this.plugin.settings.ragOptions.excludePatterns
					const excludedFiles = await findFilesMatchingPatterns(
						patterns,
						this.plugin.app.vault,
					)
					new ExcludedFilesModal(this.app, excludedFiles).open()
				}),
			)
		new Setting(containerEl)
			.setClass('infio-chat-settings-textarea')
			.addTextArea((text) =>
				text
					.setValue(this.plugin.settings.ragOptions.excludePatterns.join('\n'))
					.onChange(async (value) => {
						const patterns = value
							.split('\n')
							.map((p) => p.trim())
							.filter((p) => p.length > 0)
						await this.plugin.setSettings({
							...this.plugin.settings,
							ragOptions: {
								...this.plugin.settings.ragOptions,
								excludePatterns: patterns,
							},
						})
					}),
			)

		new Setting(containerEl)
			.setName('Chunk size')
			.setDesc(
				'Set the chunk size for text splitting. After changing this, please re-index the vault using the "Rebuild entire vault index" command.',
			)
			.addText((text) =>
				text
					.setPlaceholder('1000')
					.setValue(String(this.plugin.settings.ragOptions.chunkSize))
					.onChange(async (value) => {
						const chunkSize = parseInt(value, 10)
						if (!isNaN(chunkSize)) {
							await this.plugin.setSettings({
								...this.plugin.settings,
								ragOptions: {
									...this.plugin.settings.ragOptions,
									chunkSize,
								},
							})
						}
					}),
			)

		new Setting(containerEl)
			.setName('Threshold tokens')
			.setDesc(
				'Maximum number of tokens before switching to RAG. If the total tokens from mentioned files exceed this, RAG will be used instead of including all file contents.',
			)
			.addText((text) =>
				text
					.setPlaceholder('8192')
					.setValue(String(this.plugin.settings.ragOptions.thresholdTokens))
					.onChange(async (value) => {
						const thresholdTokens = parseInt(value, 10)
						if (!isNaN(thresholdTokens)) {
							await this.plugin.setSettings({
								...this.plugin.settings,
								ragOptions: {
									...this.plugin.settings.ragOptions,
									thresholdTokens,
								},
							})
						}
					}),
			)

		new Setting(containerEl)
			.setName('Minimum similarity')
			.setDesc(
				'Minimum similarity score for RAG results. Higher values return more relevant but potentially fewer results.',
			)
			.addText((text) =>
				text
					.setPlaceholder('0.0')
					.setValue(String(this.plugin.settings.ragOptions.minSimilarity))
					.onChange(async (value) => {
						const minSimilarity = parseFloat(value)
						if (!isNaN(minSimilarity)) {
							await this.plugin.setSettings({
								...this.plugin.settings,
								ragOptions: {
									...this.plugin.settings.ragOptions,
									minSimilarity,
								},
							})
						}
					}),
			)

		new Setting(containerEl)
			.setName('Limit')
			.setDesc(
				'Maximum number of RAG results to include in the prompt. Higher values provide more context but increase token usage.',
			)
			.addText((text) =>
				text
					.setPlaceholder('10')
					.setValue(String(this.plugin.settings.ragOptions.limit))
					.onChange(async (value) => {
						const limit = parseInt(value, 10)
						if (!isNaN(limit)) {
							await this.plugin.setSettings({
								...this.plugin.settings,
								ragOptions: {
									...this.plugin.settings.ragOptions,
									limit,
								},
							})
						}
					}),
			)
	}

	renderAutoCompleteSection(containerEl: HTMLElement): void {
		// 创建一个专门的容器来存放 AutoComplete 相关的组件
		const autoCompleteDiv = containerEl.createDiv("auto-complete-section");
		this.autoCompleteContainer = autoCompleteDiv;
		this.renderAutoCompleteContent(autoCompleteDiv);
	}

	private renderAutoCompleteContent(containerEl: HTMLElement): void {
		const updateSettings = async (update: Partial<InfioSettings>) => {
		    await this.plugin.setSettings({
		        ...this.plugin.settings,
		        ...update
		    });
		    
		    // 只重新渲染 AutoComplete 部分
		    if (this.autoCompleteContainer) {
		        this.autoCompleteContainer.empty();
		        this.renderAutoCompleteContent(this.autoCompleteContainer);
		    }
		};

		const errors = new Map();

		// AutoComplete base
		new Setting(containerEl).setName('AutoComplete').setHeading();
		this.renderComponent(containerEl,
			<BasicAutoCompleteSettings
				settings={this.plugin.settings}
				updateSettings={updateSettings}
			/>
		);

		// Model parameters
		new Setting(containerEl).setName('Model parameters').setHeading();
		this.renderComponent(containerEl,
			<ModelParametersSettings
				settings={this.plugin.settings}
				updateSettings={updateSettings}
				errors={errors}
			/>
		);

		// Preprocessing
		new Setting(containerEl).setName('Preprocessing').setHeading();
		this.renderComponent(containerEl,
			<PreprocessingSettings
				settings={this.plugin.settings}
				updateSettings={updateSettings}
				errors={errors}
			/>
		);

		// Postprocessing
		new Setting(containerEl).setName('Postprocessing').setHeading();
		this.renderComponent(containerEl,
			<PostprocessingSettings
				settings={this.plugin.settings}
				updateSettings={updateSettings}
			/>
		);

		// Trigger
		new Setting(containerEl).setName('Trigger').setHeading();
		this.renderComponent(containerEl,
			<TriggerSettingsSection
				settings={this.plugin.settings}
				updateSettings={updateSettings}
				errors={errors}
			/>
		);

		// Privacy
		new Setting(containerEl).setName('Privacy').setHeading();
		this.renderComponent(containerEl,
			<PrivacySettings
				settings={this.plugin.settings}
				updateSettings={updateSettings}
				errors={errors}
			/>
		);

		// Danger zone
		new Setting(containerEl).setName('Danger zone').setHeading();
		this.renderComponent(containerEl,
			<DangerZoneSettings
				settings={this.plugin.settings}
				updateSettings={updateSettings}
				onReset={() => {
					new Notice("Factory reset complete.");
				}}
			/>
		);

		// Advanced
		if (this.plugin.settings.advancedMode) {
			new Setting(containerEl).setName('Advanced').setHeading();
			this.renderComponent(containerEl,
				<AdvancedSettings
					settings={this.plugin.settings}
					updateSettings={updateSettings}
					errors={errors}
				/>
			);
		}
	}

	private renderComponent(containerEl: HTMLElement, component: React.ReactNode) {
		const div = containerEl.createDiv("div");
		const root = createRoot(div);
		root.render(component);
	}
}

class ExcludedFilesModal extends Modal {
	private files: TFile[]

	constructor(app: App, files: TFile[]) {
		super(app)
		this.files = files
	}

	onOpen() {
		const { contentEl } = this
		contentEl.empty()

		this.titleEl.setText(`Excluded Files (${this.files.length})`)

		if (this.files.length === 0) {
			contentEl.createEl('p', { text: 'No files match the exclusion patterns' })
			return
		}

		const list = contentEl.createEl('ul')
		this.files.forEach((file) => {
			list.createEl('li', { text: file.path })
		})
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}

class IncludedFilesModal extends Modal {
	private files: TFile[]
	private patterns: string[]

	constructor(app: App, files: TFile[], patterns: string[]) {
		super(app)
		this.files = files
		this.patterns = patterns
	}

	onOpen() {
		const { contentEl } = this
		contentEl.empty()

		this.titleEl.setText(`Included Files (${this.files.length})`)

		if (this.patterns.length === 0) {
			contentEl.createEl('p', {
				text: 'No inclusion patterns specified - all files will be included (except those matching exclusion patterns)',
			})
			return
		}

		if (this.files.length === 0) {
			contentEl.createEl('p', {
				text: 'No files match the inclusion patterns',
			})
			return
		}

		const list = contentEl.createEl('ul')
		this.files.forEach((file) => {
			list.createEl('li', { text: file.path })
		})
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
