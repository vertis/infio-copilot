import { TFile } from "obsidian";

import { InfioSettings } from "../../../types/settings";
import { DocumentChanges } from "../../../render-plugin/document-changes-listener";

import { EventHandler } from "./types";

class InitState implements EventHandler {
  async handleDocumentChange(documentChanges: DocumentChanges): Promise<void> { }

  handleSettingChanged(settings: InfioSettings): void { }

  handleAcceptKeyPressed(): boolean {
    return false;
  }

  handlePartialAcceptKeyPressed(): boolean {
    return false;
  }

  handleCancelKeyPressed(): boolean {
    return false;
  }

  handlePredictCommand(): void { }

  handleAcceptCommand(): void { }

  getStatusBarText(): string {
    return "Initializing...";
  }

  handleFileChange(file: TFile): void {

  }
}

export default InitState;
