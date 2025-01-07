// @ts-nocheck
import { Text } from "@codemirror/state";

export type Suggestion = {
  value: string;
  render: boolean;
}
export type OptionalSuggestion = Suggestion | null;

export type InlineSuggestion = {
  suggestion: OptionalSuggestion;
  doc: Text | null;
}


