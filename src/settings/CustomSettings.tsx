import React from "react";

import InfioPlugin from "../main";
import { InfioSettings } from "../types/settings";

// import ModelsSettings from "./ModelsSettings";
import ProviderSettings from "./ProviderSettings";

type CustomSettingsProps = {
	plugin: InfioPlugin;
}

const CustomSettings: React.FC<CustomSettingsProps> = ({ plugin }) => {
	const settings = plugin.settings;

	const handleSettingsUpdate = async (newSettings: InfioSettings) => {
		await plugin.setSettings(newSettings);
		// Force refresh the settings page to update dropdowns
		plugin.settingTab.display();
	};

	return (
		<div>
			<h1 className="infio-llm-setting-title">
				<div>
					Infio Settings <small>v{settings.version}</small>
				</div>
			</h1>
			<ProviderSettings settings={settings} setSettings={handleSettingsUpdate} />
		</div>
	);
};

export default CustomSettings;
