
import { TFile } from "obsidian";

import { DocumentChanges } from "../../../render-plugin/document-changes-listener";
import { InfioSettings } from "../../../types/settings";

export type EventHandler = {
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
