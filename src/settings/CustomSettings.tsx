import React from "react";

import InfioPlugin from "../main";
import { InfioSettings } from "../types/settings";

import ModelsSettings from "./ModelsSettings";

interface CustomSettingsProps {
	plugin: InfioPlugin;
}

const CustomSettings: React.FC<CustomSettingsProps> = ({ plugin }) => {
	const settings = plugin.settings;

	const handleSettingsUpdate = async (newSettings: InfioSettings) => {
		await plugin.setSettings(newSettings);
	};

	return (
		<div>
			<h1 style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
				<div>
					Infio Settings <small>v{settings.version}</small>
				</div>
			</h1>
			<ModelsSettings settings={settings} setSettings={handleSettingsUpdate} />
		</div>
	);
};

export default CustomSettings;
