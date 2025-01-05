import { TFile } from "obsidian";

import { InfioSettings } from "../../../types/settings";

import State from "./state";

class DisabledManualState extends State {
  getStatusBarText(): string {
    return "Disabled";
  }

  handleSettingChanged(settings: InfioSettings): void {
    if (this.context.settings.autocompleteEnabled) {
      this.context.transitionToIdleState();
    }
  }

  handleFileChange(file: TFile): void { }
}

export default DisabledManualState;
