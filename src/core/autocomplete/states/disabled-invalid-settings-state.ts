import { InfioSettings } from "../../../types/settings";
import { checkForErrors } from "../../../utils/auto-complete";

import State from "./state";

class DisabledInvalidSettingsState extends State {
  getStatusBarText(): string {
    return "Disabled invalid settings";
  }

  handleSettingChanged(settings: InfioSettings) {
    const settingErrors = checkForErrors(settings);
    if (settingErrors.size > 0) {
      return
    }
    if (this.context.settings.autocompleteEnabled) {
      this.context.transitionToIdleState();
    } else {
      this.context.transitionToDisabledManualState();
    }
  }

}

export default DisabledInvalidSettingsState;
