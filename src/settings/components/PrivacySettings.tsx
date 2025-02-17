import * as React from "react";

import { InfioSettings } from '../../types/settings';

import SettingsItem from "./SettingsItem";

type Props = {
    settings: InfioSettings;
    updateSettings: (update: Partial<InfioSettings>) => void;
    errors: Map<string, string>;
}

export default function PrivacySettings({ settings, updateSettings, errors }: Props): React.JSX.Element {
    return (
        <>
            <SettingsItem
                name={"Ignored files"}
                description={
                    <div>
                        <p>This field enables you to specify files and directories that the plugin should ignore. When
                            you open any of these files, the plugin will automatically disable itself and display a
                            'disabled' status in the bottom menu. Enter one pattern per line. These patterns function
                            similar to glob patterns. Here are some frequently used patterns:</p>
                        <ul>
                            <li><code>path/to/folder/**</code>: This pattern ignores all files and sub folders within
                                this folder.
                            </li>
                            <li><code>"**/secret/**"</code>: This pattern ignores any file located inside a 'secret'
                                directory,
                                regardless of its location in the path.
                            </li>
                            <li><code>!path/to/folder/example.md</code>: This pattern explicitly undoes an ignore,
                                making this file noticeable to the plugin.
                            </li>
                            <li><code>**/*Python*.md</code>: This pattern ignores any file with 'Python' in its name,
                                irrespective of its location.
                            </li>
                        </ul>
                    </div>
                }
                display={"block"}
                errorMessage={errors.get("ignoredFilePatterns")}
            >
                <textarea
                    className="infio-autocomplete-setting-item-textarea"
                    rows={10}
                    placeholder="Your file patterns, e.g., **/secret/**"
                    value={settings.ignoredFilePatterns}
                    onChange={(e) =>
                        updateSettings({
                            ignoredFilePatterns: e.target.value
                        })
                    }
                />
            </SettingsItem>
            <SettingsItem
                name={"Ignored tags"}
                description={
                    <div>
                        <p>Files containing any of these tags will be ignored. When you open a file containing a
                            tag listed here, the plugin will automatically disable itself and display a 'disabled'
                            status in the bottom menu. Enter one tag per line.
                        </p>
                    </div>
                }
                display={"block"}
                errorMessage={errors.get("ignoredTags")}
            >
                <textarea
                    className="infio-autocomplete-setting-item-textarea"
                    rows={10}
                    placeholder="Your file tags, e.g., secret"
                    value={settings.ignoredTags}
                    onChange={(e) =>
                        updateSettings({
                            ignoredTags: e.target.value
                        })
                    }
                />
            </SettingsItem>
        </>
    );
}
