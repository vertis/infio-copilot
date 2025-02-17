import * as React from "react";

import { InfioSettings } from '../../types/settings';
import {
	MAX_DELAY,
	MIN_DELAY,
} from "../versions";

import SliderSettingsItem from "./SliderSettingsItem";
import TriggerSettings from "./TriggerSettings";

type Props = {
    settings: InfioSettings;
    updateSettings: (update: Partial<InfioSettings>) => void;
    errors: Map<string, string>;
}

export default function TriggerSettingsSection({ settings, updateSettings, errors }: Props): React.JSX.Element {
    return (
        <>
            <SliderSettingsItem
                name={"Delay"}
                description={
                    "Delay in ms between the last character typed and the completion request."
                }
                value={settings.delay}
                errorMessage={errors.get("delay")}
                setValue={(value: number) => updateSettings({ delay: value })}
                min={MIN_DELAY}
                max={MAX_DELAY}
                step={100}
                suffix={"ms"}
            />
            <TriggerSettings
                name={"Trigger words"}
                description={
                    "Completions will be triggered if the text before the matches any of these words or characters. This can either be a direct string match or a regex match. When using a regex, make sure to include the end of line character ($)."
                }
                triggers={settings.triggers}
                setValues={(triggers) => updateSettings({ triggers })}
                errorMessage={errors.get("triggerWords")}
                errorMessages={errors}
            />
        </>
    );
}
