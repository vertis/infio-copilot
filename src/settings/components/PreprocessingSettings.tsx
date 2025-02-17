import * as React from "react";

import { InfioSettings } from '../../types/settings';
import {
	MAX_MAX_CHAR_LIMIT,
	MIN_MAX_CHAR_LIMIT,
} from "../versions";

import CheckBoxSettingItem from "./CheckBoxSettingItem";
import SliderSettingsItem from "./SliderSettingsItem";

type Props = {
    settings: InfioSettings;
    updateSettings: (update: Partial<InfioSettings>) => void;
    errors: Map<string, string>;
}

export default function PreprocessingSettings({ settings, updateSettings, errors }: Props): React.JSX.Element {
    return (
        <>
            <CheckBoxSettingItem
                name={"Don't include Dataview"}
                description={
                    "Dataview(js) blocks can be quite long while not providing much value to the AI. If this setting is enabled, data view blocks will be removed promptly to reduce the number of tokens. This could save you some money in the long run."
                }
                enabled={settings.dontIncludeDataviews}
                setEnabled={(value) =>
                    updateSettings({ dontIncludeDataviews: value })
                }
            />
            <SliderSettingsItem
                name={"Maximum prefix length"}
                description={
                    "The maximum number of characters that will be included in the prefix. A larger value will increase the context for the completion, but it can also increase the cost or push you over the token limit."
                }
                value={settings.maxPrefixCharLimit}
                errorMessage={errors.get("maxPrefixCharLimit")}
                setValue={(value: number) =>
                    updateSettings({ maxPrefixCharLimit: value })
                }
                min={MIN_MAX_CHAR_LIMIT}
                max={MAX_MAX_CHAR_LIMIT}
                step={100}
                suffix={" chars"}
            />
            <SliderSettingsItem
                name={"Maximum suffix length"}
                description={
                    "The maximum number of characters that will be included in the suffix. A larger value will increase the context for the completion, but it can also increase the cost or push you over the token limit."
                }
                value={settings.maxSuffixCharLimit}
                errorMessage={errors.get("maxSuffixCharLimit")}
                setValue={(value: number) =>
                    updateSettings({ maxSuffixCharLimit: value })
                }
                min={MIN_MAX_CHAR_LIMIT}
                max={MAX_MAX_CHAR_LIMIT}
                step={100}
                suffix={" chars"}
            />
        </>
    );
}
