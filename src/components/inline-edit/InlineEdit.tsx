import { CornerDownLeft } from 'lucide-react';
import { MarkdownView, Plugin } from 'obsidian';
import React, { useEffect, useRef, useState } from 'react';

import { APPLY_VIEW_TYPE } from '../../constants';
import LLMManager from '../../core/llm/manager';
import { InfioSettings } from '../../types/settings';
import { GetProviderModelIds } from '../../utils/api';
import { ApplyEditToFile } from '../../utils/apply';
import { removeAITags } from '../../utils/content-filter';
import { PromptGenerator } from '../../utils/prompt-generator';

type InlineEditProps = {
	source: string;
	secStartLine: number;
	secEndLine: number;
	plugin: Plugin;
	settings: InfioSettings;
}

type InputAreaProps = {
	value: string;
	onChange: (value: string) => void;
	handleSubmit: () => void;
	handleClose: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ value, onChange, handleSubmit, handleClose }) => {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		textareaRef.current?.focus();
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter') {
			if (e.shiftKey) {
				// Shift + Enter: 允许换行，使用默认行为
				return;
			}
			// 普通 Enter: 阻止默认行为并触发提交
			e.preventDefault();
			handleSubmit();
		} else if (e.key === 'Escape') {
			// 当按下 Esc 键时关闭编辑器
			handleClose();
		}
	};

	return (
		<div className="infio-ai-block-input-wrapper">
			<textarea
				ref={textareaRef}
				className="infio-ai-block-content"
				placeholder="Input instruction, Enter to submit, Esc to close"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={handleKeyDown}
			/>
		</div>
	);
};

type ControlAreaProps = {
	settings: InfioSettings;
	onSubmit: () => void;
	selectedModel: string;
	onModelChange: (model: string) => void;
	isSubmitting: boolean;
}

const ControlArea: React.FC<ControlAreaProps> = ({
	settings,
	onSubmit,
	selectedModel,
	onModelChange,
	isSubmitting,
}) => {
	const [providerModels, setProviderModels] = useState<string[]>([]);

	useEffect(() => {
		const fetchModels = async () => {
			try {
				const models = await GetProviderModelIds(settings.chatModelProvider);
				setProviderModels(models);
			} catch (error) {
				console.error("Failed to fetch provider models:", error);
			}
		};
		fetchModels();
	}, [settings]);

	return (
		<div className="infio-ai-block-controls">
			<select
				className="infio-ai-block-model-select"
				value={selectedModel}
				onChange={(e) => onModelChange(e.target.value)}
				disabled={isSubmitting}
			>
				{providerModels.map((modelId) => (
					<option key={modelId} value={modelId}>
						{modelId}
					</option>
				))}
			</select>
			<button
				className="infio-ai-block-submit-button"
				onClick={onSubmit}
				disabled={isSubmitting}
			>
				{isSubmitting ? "submitting..." : (
					<>
						submit 
						<CornerDownLeft size={11} className="infio-ai-block-submit-icon" />
					</>
				)}
			</button>
		</div>);
};

export const InlineEdit: React.FC<InlineEditProps> = ({
	source,
	secStartLine,
	secEndLine,
	plugin,
	settings,
}) => {
	const [instruction, setInstruction] = useState("");
	const [selectedModel, setSelectedModel] = useState(settings.chatModelId);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const llmManager = new LLMManager(settings);

	const promptGenerator = new PromptGenerator(
		async () => {
			throw new Error("RAG not needed for inline edit");
		},
		plugin.app,
		settings
	);

	const handleClose = () => {
		const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.editor) return;
		activeView.editor.replaceRange(
			"",
			{ line: secStartLine, ch: 0 },
			{ line: secEndLine + 1, ch: 0 }
		);
	};

	const getActiveContext = async () => {
		const activeFile = plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			console.error("No active file");
			return {};
		}

		const editor = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (!editor) {
			console.error("No active editor");
			return { activeFile };
		}

		const selection = editor.getSelection();
		if (!selection) {
			console.error("No text selected");
			return { activeFile, editor };
		}

		return { activeFile, editor, selection };
	};

	const parseSmartComposeBlock = (content: string) => {
		const match = /<infio_block[^>]*>([\s\S]*?)<\/infio_block>/.exec(content);
		if (!match) {
			return null;
		}

		const blockContent = match[1].trim();
		const attributes = /startLine="(\d+)"/.exec(match[0]);
		const startLine = attributes ? parseInt(attributes[1]) : undefined;
		const endLineMatch = /endLine="(\d+)"/.exec(match[0]);
		const endLine = endLineMatch ? parseInt(endLineMatch[1]) : undefined;

		return {
			startLine,
			endLine,
			content: blockContent,
		};
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			const { activeFile, editor, selection } = await getActiveContext();
			if (!activeFile || !editor || !selection) {
				setIsSubmitting(false);
				return;
			}

			const chatModel = {
				provider: settings.chatModelProvider,
				modelId: settings.chatModelId,
			};
			if (!chatModel) {
				setIsSubmitting(false);
				throw new Error("Invalid chat model");
			}

			const from = editor.getCursor("from");
			const to = editor.getCursor("to");
			const defaultStartLine = from.line + 1;
			const defaultEndLine = to.line + 1;

			const requestMessages = await promptGenerator.generateEditMessages({
				currentFile: activeFile,
				selectedContent: selection,
				instruction: instruction,
				startLine: defaultStartLine,
				endLine: defaultEndLine,
			});

			const response = await llmManager.generateResponse(chatModel, {
				model: chatModel.modelId,
				messages: requestMessages,
				stream: false,
			});

			if (!response.choices[0].message.content) {
				setIsSubmitting(false);
				throw new Error("Empty response from LLM");
			}

			const parsedBlock = parseSmartComposeBlock(
				response.choices[0].message.content
			);
			const finalContent = parsedBlock?.content || response.choices[0].message.content;
			const startLine = parsedBlock?.startLine || defaultStartLine;
			const endLine = parsedBlock?.endLine || defaultEndLine;

			const updatedContent = await ApplyEditToFile(
				await plugin.app.vault.cachedRead(activeFile),
				finalContent,
				startLine,
				endLine
			);

			if (!updatedContent) {
				console.error("Failed to apply changes");
				setIsSubmitting(false);
				return;
			}

			const oldContent = await plugin.app.vault.read(activeFile);
			await plugin.app.workspace.getLeaf(true).setViewState({
				type: APPLY_VIEW_TYPE,
				active: true,
				state: {
					file: activeFile,
					oldContent: removeAITags(oldContent),
					newContent: removeAITags(updatedContent),
				},
			});
		} catch (error) {
			console.error("Error in inline edit:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="infio-ai-block-container"
			id="infio-ai-block-container"
		>
			<InputArea value={instruction} onChange={setInstruction} handleSubmit={handleSubmit} handleClose={handleClose} />
			<button className="infio-ai-block-close-button" onClick={handleClose}>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
			<ControlArea
				settings={settings}
				onSubmit={handleSubmit}
				selectedModel={selectedModel}
				onModelChange={setSelectedModel}
				isSubmitting={isSubmitting}
			/>
		</div>
	);
};
