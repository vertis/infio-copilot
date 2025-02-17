import * as React from "react";

import { InfioSettings } from '../../types/settings';

import CheckBoxSettingItem from "./CheckBoxSettingItem";

type Props = {
    settings: InfioSettings;
    updateSettings: (update: Partial<InfioSettings>) => void;
}

export default function BasicAutoCompleteSettings({ settings, updateSettings }: Props): React.JSX.Element {
    return (
        <>
            <CheckBoxSettingItem
                name={"Enable"}
                description={
                    "If disabled, nothing will trigger the extension or can result in an API call."
                }
                enabled={settings.autocompleteEnabled}
                setEnabled={(value) => updateSettings({ autocompleteEnabled: value })}
            />
            <CheckBoxSettingItem
                name={"Cache completions"}
                description={
                    "If disabled, the plugin will not cache the completions. After accepting or rejecting a completion, the plugin will not remember it. This might result in more API calls."
                }
                enabled={settings.cacheSuggestions}
                setEnabled={(value) => updateSettings({ cacheSuggestions: value })}
            />
            <CheckBoxSettingItem
                name={"Debug mode"}
                description={
                    "If enabled, various debug messages will be logged to the console, such as the complete response from the API, including the chain of thought tokens."
                }
                enabled={settings.debugMode}
                setEnabled={(value) => updateSettings({ debugMode: value })}
            />
        </>
    );
}
