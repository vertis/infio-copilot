
import { TFile } from "obsidian";

import { InfioSettings } from "../../../types/settings";
import { DocumentChanges } from "../../../render-plugin/document-changes-listener";

export interface EventHandler {
  handleSettingChanged(settings: InfioSettings): void;

  handleDocumentChange(documentChanges: DocumentChanges): Promise<void>;

  handleAcceptKeyPressed(): boolean;

  handlePartialAcceptKeyPressed(): boolean;

  handleCancelKeyPressed(): boolean;

  handlePredictCommand(prefix: string, suffix: string): void;
  handleAcceptCommand(): void;

  getStatusBarText(): string;

  handleFileChange(file: TFile): void;

}
