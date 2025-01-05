import { TFile } from "obsidian";

import { InfioSettings } from "../../../types/settings";

import State from "./state";


class DisabledFileSpecificState extends State {
  getStatusBarText(): string {
    return "Disabled for this file";
  }

  handleSettingChanged(settings: InfioSettings) {
    if (!this.context.settings.autocompleteEnabled) {
      this.context.transitionToDisabledManualState();
    }
    if (!this.context.isCurrentFilePathIgnored() || !this.context.currentFileContainsIgnoredTag()) {
      this.context.transitionToIdleState();
    }
  }

  handleFileChange(file: TFile): void {
    if (this.context.isCurrentFilePathIgnored() || this.context.currentFileContainsIgnoredTag()) {
      return;
    }

    if (this.context.settings.autocompleteEnabled) {
      this.context.transitionToIdleState();
    } else {
      this.context.transitionToDisabledManualState();
    }
  }
}

export default DisabledFileSpecificState;
