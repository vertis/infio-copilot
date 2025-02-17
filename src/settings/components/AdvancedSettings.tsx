import * as React from "react";

import { InfioSettings } from '../../types/settings';
import SettingsItem from "./SettingsItem";
import TextSettingItem from "./TextSettingItem";
import FewShotExampleSettings from "./FewShotExampleSettings";

type Props = {
    settings: InfioSettings;
    updateSettings: (update: Partial<InfioSettings>) => void;
    errors: Map<string, string>;
}

export default function AdvancedSettings({ settings, updateSettings, errors }: Props): React.JSX.Element {
    if (!settings.advancedMode) {
        return null;
    }

    return (
        <>
            <TextSettingItem
                name={"Chain of thought removal regex"}
                description={
                    "This regex is used to remove the chain of thought tokens from the generated answer. If it is not implemented correctly, the chain of thought tokens will be included in the suggested completion."
                }
                placeholder={"your regex..."}
                value={settings.chainOfThoughRemovalRegex}
                errorMessage={errors.get("chainOfThoughRemovalRegex")}
                setValue={(value: string) =>
                    updateSettings({
                        chainOfThoughRemovalRegex: value,
                    })
                }
            />

            <SettingsItem
                name={"System message"}
                description={
                    "This system message gives the models all the context and instructions they need to complete the answer generation tasks. You can edit this message to your liking. If you edit the chain of thought formatting, make sure to update the extract regex and examples accordingly."
                }
                display={"block"}
                errorMessage={errors.get("systemMessage")}
            >
                <textarea
                    className="infio-autocomplete-setting-item-textarea"
                    rows={10}
                    placeholder="Your system message..."
                    value={settings.systemMessage}
                    onChange={(e) =>
                        updateSettings({
                            systemMessage: e.target.value,
                        })
                    }
                />
            </SettingsItem>

            <SettingsItem
                name={"User message template"}
                description={
                    "This template defines how the prefix and suffix are formatted to create the user message. You have access to two variables: {{prefix}} and {{suffix}}. If you edit this, make sure to update the examples accordingly."
                }
                display={"block"}
                errorMessage={errors.get("userMessageTemplate")}
            >
                <textarea
                    className="infio-autocomplete-setting-item-textarea"
                    rows={3}
                    placeholder="{{prefix}}<mask/>{{suffix}}"
                    value={settings.userMessageTemplate}
                    onChange={(e) =>
                        updateSettings({
                            userMessageTemplate: e.target.value,
                        })
                    }
                />
            </SettingsItem>

            <FewShotExampleSettings
                fewShotExamples={settings.fewShotExamples}
                name={"Few shot examples"}
                description={
                    "The model uses these examples to learn the expected answer format. Not all examples are sent at the same time. We only send the relevant examples, given the current cursor location. For example, the CodeBlock examples are only sent if the cursor is in a code block. If no special context is detected, we send the Text examples. Each context has a default of 2 examples, but you can add or remove examples if there is at least one per context. You can add more examples, but this will increase the inference costs."
                }
                setFewShotExamples={(value) =>
                    updateSettings({ fewShotExamples: value })
                }
                errorMessages={errors}
            />
        </>
    );
}
