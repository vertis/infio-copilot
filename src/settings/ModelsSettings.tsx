import { Notice } from "obsidian";
import React, { useState } from "react";

import { CustomLLMModel, ModelProviders } from "../types/llm/model";
import { InfioSettings } from "../types/settings";

import { DropdownComponent, TextComponent, ToggleComponent } from "./FormComponents";

interface ModelRowProps {
	model: CustomLLMModel;
	canDelete: boolean;
	onToggle: (enabled: boolean) => void;
	onDelete: () => void;
}

const ModelRow: React.FC<ModelRowProps> = ({ model, canDelete, onToggle, onDelete }) => (
	<tr>
		<td>{model.provider}</td>
		<td>{model.name}{model.isEmbeddingModel ? " [embedding]" : ""}</td>
		<td>
			<ToggleComponent
				value={model.enabled}
				onChange={onToggle}
			/>
		</td>
		<td>
			{!canDelete && (
				<button onClick={onDelete}>Delete</button>
			)}
		</td>
	</tr>
);

interface ModelFormProps {
	providers: string[];
	onSubmit: (model: CustomLLMModel) => void;
	isEmbeddingModel: boolean;
}

const ModelForm: React.FC<ModelFormProps> = ({ providers, onSubmit, isEmbeddingModel }) => {
	const [model, setModel] = useState<CustomLLMModel>({
		name: "",
		provider: providers[0] || "",
		baseUrl: "",
		apiKey: "",
		enabled: true,
		isBuiltIn: false,
		isEmbeddingModel,
	});

	const handleSubmit = () => {
		if (model.name && model.provider) {
			onSubmit(model);
			setModel({ ...model, name: "", baseUrl: "", apiKey: "" });
		} else {
			new Notice("Please fill in necessary fields!");
		}
	};

	return (
		<div className="infio-llm-add-custom-model-form infio-chat-settings-model-container">
			<TextComponent
				name="Model:"
				value={model.name}
				placeholder="Enter model name"
				onChange={(name) => setModel({ ...model, name })}
			/>
			<DropdownComponent
				name="Provider:"
				options={providers}
				value={model.provider}
				onChange={(provider) => setModel({ ...model, provider })}
			/>
			<TextComponent
				name="BaseURL (optional):"
				value={model.baseUrl || ""}
				placeholder="https://api.example.com/v1"
				onChange={(baseUrl) => setModel({ ...model, baseUrl })}
			/>
			<TextComponent
				name="APIKey:"
				value={model.apiKey || ""}
				placeholder="Enter API key"
				type="password"
				onChange={(apiKey) => setModel({ ...model, apiKey })}
			/>
			<ToggleComponent
				name="IsEmbedding:"
				value={model.isEmbeddingModel || false}
				onChange={(isEmbeddingModel) => setModel({ ...model, isEmbeddingModel })}
			/>
			<button onClick={handleSubmit} className="infio-llm-add-model-button">
				Add Model
			</button>
		</div>
	);
};

interface ModelListProps {
	models: CustomLLMModel[];
	chatModelKey: string;
	applyModelKey: string;
	onUpdateModel: (index: number, model: CustomLLMModel) => void;
	onDeleteModel: (modelKey: string) => void;
}

const ModelList: React.FC<ModelListProps> = ({
	models,
	chatModelKey,
	applyModelKey,
	onUpdateModel,
	onDeleteModel,
}) => (
	<div className="model-settings-container">
		<table className="infio-llm-model-settings-table">
			<thead>
				<tr>
					<th>Provider</th>
					<th>Model</th>
					<th>Enabled</th>
					<th>Delete</th>
				</tr>
			</thead>
			<tbody>
				{models.map((model, index) => (
					<ModelRow
						key={`${model.name}`}
						model={model}
						canDelete={`${model.name}` in [chatModelKey, applyModelKey]}
						onToggle={(enabled) => {
							const updatedModel = { ...model, enabled };
							onUpdateModel(index, updatedModel);
						}}
						onDelete={() => onDeleteModel(`${model.name}`)}
					/>
				))}
			</tbody>
		</table>
	</div>
);

interface ModelsSettingsProps {
	settings: InfioSettings;
	setSettings: (settings: InfioSettings) => void;
}

const ModelsSettings: React.FC<ModelsSettingsProps> = ({ settings, setSettings }) => {
	const [isAddModelOpen, setIsAddModelOpen] = useState(false);

	const [activeModels, setActiveModels] = useState(settings.activeModels);

	const handleUpdateModel = (index: number, updatedModel: CustomLLMModel) => {
		const newActiveModels = [...activeModels];
		newActiveModels[index] = updatedModel;
		setSettings({ ...settings, activeModels: newActiveModels });
		setActiveModels(newActiveModels);
	};

	const handleAddModel = (newModel: CustomLLMModel) => {
		const newActiveModels = [...activeModels, newModel];
		setSettings({ ...settings, activeModels: newActiveModels });
		setActiveModels(newActiveModels);
	};

	const handleDeleteModel = (modelKey: string) => {
		const newActiveModels = activeModels.filter(
			(model) => `${model.name}` !== modelKey
		);

		setSettings({
			...settings,
			activeModels: newActiveModels,
		});
		setActiveModels(newActiveModels);
	};

	return (
		<div>
			<h2>Models</h2>
			<div className="infio-llm-chat-setting-title infio-chat-setting-item-container">
				<ModelList
					models={activeModels as CustomLLMModel[]}
					chatModelKey={settings.chatModelId}
					applyModelKey={settings.applyModelId}
					onUpdateModel={handleUpdateModel}
					onDeleteModel={handleDeleteModel}
				/>
				<div className="infio-llm-add-custom-model">
					<h2 onClick={() => setIsAddModelOpen(!isAddModelOpen)} style={{ cursor: "pointer" }}>
						Add Custom Model {isAddModelOpen ? "▼" : "▶"}
					</h2>
					{isAddModelOpen && (
						<ModelForm
							providers={Object.values(ModelProviders)}
							onSubmit={handleAddModel}
							isEmbeddingModel={false}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default ModelsSettings;
