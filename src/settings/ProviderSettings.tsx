import React, { useMemo, useState } from 'react';

// import { PROVIDERS } from '../constants';
import { ApiProvider } from '../types/llm/model';
import { InfioSettings } from '../types/settings';
import { GetAllProviders } from '../utils/api';
// import { siliconFlowDefaultModelId } from '../utils/api';

import { DropdownComponent, TextComponent, ToggleComponent } from './FormComponents';
import { ComboBoxComponent } from './ProviderModelsPicker';

type ProviderSettingKey =
	| 'infioProvider'
	| 'openrouterProvider'
	| 'openaiProvider'
	| 'siliconflowProvider'
	| 'alibabaQwenProvider'
	| 'anthropicProvider'
	| 'deepseekProvider'
	| 'googleProvider'
	| 'groqProvider'
	| 'ollamaProvider'
	| 'openaicompatibleProvider';

interface ProviderSettingsProps {
	settings: InfioSettings;
	setSettings: (settings: InfioSettings) => Promise<void>;
}

const keyMap: Record<ApiProvider, ProviderSettingKey> = {
	'Infio': 'infioProvider',
	'OpenRouter': 'openrouterProvider',
	'OpenAI': 'openaiProvider',
	'SiliconFlow': 'siliconflowProvider',
	'AlibabaQwen': 'alibabaQwenProvider',
	'Anthropic': 'anthropicProvider',
	'Deepseek': 'deepseekProvider',
	'Google': 'googleProvider',
	'Groq': 'groqProvider',
	'Ollama': 'ollamaProvider',
	'OpenAICompatible': 'openaicompatibleProvider'
};

const getProviderSettingKey = (provider: ApiProvider): ProviderSettingKey => {
	return keyMap[provider];
};

const PROVIDERS = GetAllProviders();

const ProviderSettings: React.FC<ProviderSettingsProps> = ({ settings, setSettings }) => {
	const [currProvider, setCurrProvider] = useState(settings.defaultProvider);

	const providerSetting = useMemo(() => {
		const providerKey = getProviderSettingKey(currProvider);
		return settings[providerKey] || {};
	}, [currProvider, settings]);

	const updateProvider = (provider: ApiProvider) => {
		setCurrProvider(provider);
		setSettings({
			...settings,
			defaultProvider: provider
		});
	};

	const updateProviderApiKey = (value: string) => {
		const providerKey = getProviderSettingKey(currProvider);
		const providerSettings = settings[providerKey];

		setSettings({
			...settings,
			[providerKey]: {
				...providerSettings,
				apiKey: value
			}
		});
	};

	const updateProviderUseCustomUrl = (value: boolean) => {
		const providerKey = getProviderSettingKey(currProvider);
		const providerSettings = settings[providerKey];

		setSettings({
			...settings,
			[providerKey]: {
				...providerSettings,
				useCustomUrl: value
			}
		});
	};

	const updateProviderBaseUrl = (value: string) => {
		const providerKey = getProviderSettingKey(currProvider);
		const providerSettings = settings[providerKey];

		setSettings({
			...settings,
			[providerKey]: {
				...providerSettings,
				baseUrl: value
			}
		});
	};

	const updateChatModelId = (provider: ApiProvider, modelId: string) => {
		setSettings({
			...settings,
			chatModelProvider: provider,
			chatModelId: modelId
		});
	};

	const updateApplyModelId = (provider: ApiProvider, modelId: string) => {
		setSettings({
			...settings,
			applyModelProvider: provider,
			applyModelId: modelId
		});
	};

	const updateEmbeddingModelId = (provider: ApiProvider, modelId: string) => {
		setSettings({
			...settings,
			embeddingModelProvider: provider,
			embeddingModelId: modelId
		});
	};

	return (
		<div className="infio-llm-setting-provider">
			<DropdownComponent
				name="API Provider:"
				value={currProvider}
				options={PROVIDERS}
				onChange={updateProvider}
			/>
			<div className="infio-llm-setting-divider"></div>
			<TextComponent
				name={currProvider + " API Key:"}
				placeholder="Enter your API key"
				value={providerSetting.apiKey || ''}
				onChange={updateProviderApiKey}
				type="password"
			/>
			<div className="infio-llm-setting-divider"></div>
			<ToggleComponent
				name="Use custom base URL"
				value={providerSetting.useCustomUrl || false}
				onChange={updateProviderUseCustomUrl}
			/>
			{providerSetting.useCustomUrl && (
				<TextComponent
					placeholder="Enter your custom API endpoint URL"
					value={providerSetting.baseUrl || ''}
					onChange={updateProviderBaseUrl}
				/>
			)}

			<div className="infio-llm-setting-divider"></div>
			<div className="infio-llm-setting-divider"></div>
			<ComboBoxComponent
				name="Chat Model:"
				provider={settings.chatModelProvider || currProvider}
				modelId={settings.chatModelId}
				updateModel={updateChatModelId}
			/>
			<div className="infio-llm-setting-divider"></div>
			<ComboBoxComponent
				name="Autocomplete Model:"
				provider={settings.applyModelProvider || currProvider}
				modelId={settings.applyModelId}
				updateModel={updateApplyModelId}
			/>
			<div className="infio-llm-setting-divider"></div>
			<ComboBoxComponent
				name="Embedding Model:"
				provider={settings.embeddingModelProvider || ApiProvider.Google}
				modelId={settings.embeddingModelId}
				isEmbedding={true}
				updateModel={updateEmbeddingModelId}
			/>
			<div className="infio-llm-setting-divider"></div>
			<div className="infio-llm-setting-divider"></div>
		</div>
	);
};

export default ProviderSettings;
