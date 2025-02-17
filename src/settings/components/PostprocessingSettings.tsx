import * as React from "react";

import { InfioSettings } from '../../types/settings';

import CheckBoxSettingItem from "./CheckBoxSettingItem";

type Props = {
    settings: InfioSettings;
    updateSettings: (update: Partial<InfioSettings>) => void;
}

export default function PostprocessingSettings({ settings, updateSettings }: Props): React.JSX.Element {
    return (
        <>
            <CheckBoxSettingItem
                name={"Auto remove duplicate mat block indicators"}
                description={
                    "The AI model might eagerly add a math block indicator ($), even though the cursor is already inside a math block. If this setting is enabled, the plugin will automatically remove these duplicate indicators from the completion."
                }
                enabled={settings.removeDuplicateMathBlockIndicator}
                setEnabled={(value) =>
                    updateSettings({ removeDuplicateMathBlockIndicator: value })
                }
            />
            <CheckBoxSettingItem
                name={"Auto remove duplicate code block indicators"}
                description={
                    "The AI model might eagerly add a code block indicator (`), even though the cursor is already inside a code block. If this setting is enabled, the plugin will automatically remove these duplicate indicators from the completion."
                }
                enabled={settings.removeDuplicateCodeBlockIndicator}
                setEnabled={(value) =>
                    updateSettings({ removeDuplicateCodeBlockIndicator: value })
                }
            />
        </>
    );
}
