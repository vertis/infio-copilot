import * as React from "react";

import { InfioSettings } from '../../types/settings';

import CheckBoxSettingItem from "./CheckBoxSettingItem";
import SettingsItem from "./SettingsItem";

type Props = {
    settings: InfioSettings;
    updateSettings: (update: Partial<InfioSettings>) => void;
    onReset: () => void;
}

export default function DangerZoneSettings({ settings, updateSettings, onReset }: Props): React.JSX.Element {
    return (
        <>
            <SettingsItem
                name={"Factory reset"}
                description={
                    "Messed-up the settings? No worries, press this button! After that, the plugin will go back to the default settings. The URL and API key will remain unchanged."
                }
            >
                <button
                    aria-label="Reset to default settings"
                    onClick={onReset}
                >
                    Reset
                </button>
            </SettingsItem>
            <CheckBoxSettingItem
                name={"Advanced mode"}
                description={
                    "If you are familiar with prompt engineering, you can enable this setting to view the prompt generation and a few shot example settings. Turn off this button. It will not reset your changes; use the factory reset button for that."
                }
                enabled={settings.advancedMode}
                setEnabled={(value) => updateSettings({ advancedMode: value })}
            />
        </>
    );
}
