import { Result } from "neverthrow";

import Context from "./context-detection";

export type AutocompleteService = {
  fetchPredictions(
    prefix: string,
    suffix: string
  ): Promise<Result<string, Error>>;
}

export type PostProcessor = {
  process(
    prefix: string,
    suffix: string,
    completion: string,
    context: Context
  ): string;
}

export type PreProcessor = {
  process(prefix: string, suffix: string, context: Context): PrefixAndSuffix;
  removesCursor(prefix: string, suffix: string): boolean;
}

export type PrefixAndSuffix = {
  prefix: string;
  suffix: string;
}

export type ChatMessage = {
  content: string;
  role: "user" | "assistant" | "system";
}


export type UserMessageFormattingInputs = {
  prefix: string;
  suffix: string;
}

export type UserMessageFormatter = (
  inputs: UserMessageFormattingInputs
) => string;

export type ApiClient = {
  queryChatModel(messages: ChatMessage[]): Promise<Result<string, Error>>;
  checkIfConfiguredCorrectly?(): Promise<string[]>;
}

export type ModelOptions = {
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
}
