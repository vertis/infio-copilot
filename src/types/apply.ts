/**
 * 用于指定插入内容的工具参数
 */

export enum ApplyStatus {
	Idle = 0,
	Applied = 1,
	Failed = 2,
	Rejected = 3,
}

export type ReadFileToolArgs = {
	type: 'read_file';
	filepath?: string;
}

export type ListFilesToolArgs = {
	type: 'list_files';
	filepath?: string;
	recursive?: boolean;
}

export type RegexSearchFilesToolArgs = {
	type: 'regex_search_files';
	filepath?: string;
	regex?: string;
	file_pattern?: string;
	finish?: boolean;
}

export type SemanticSearchFilesToolArgs = {
	type: 'semantic_search_files';
	filepath?: string;
	query?: string;
	finish?: boolean;
}
export type WriteToFileToolArgs = {
	type: 'write_to_file';
	filepath?: string;
	content?: string;
	startLine?: number;
	endLine?: number;
}

export type InsertContentToolArgs = {
	type: 'insert_content';
	filepath?: string;
	content?: string;
	startLine?: number;
	endLine?: number;
}

export type SearchAndReplaceToolArgs = {
	type: 'search_and_replace';
	filepath: string;
	operations: {
		search: string;
		replace: string;
		startLine?: number;
		endLine?: number;
		useRegex?: boolean;
		ignoreCase?: boolean;
		regexFlags?: string;
	}[];
}

export type SearchWebToolArgs = {
	type: 'search_web';
	query: string;
	finish?: boolean;
}

export type FetchUrlsContentToolArgs = {
	type: 'fetch_urls_content';
	urls: string[];
	finish?: boolean;
}

export type SwitchModeToolArgs = {
	type: 'switch_mode';
	mode: string;
	reason: string;
	finish?: boolean;
}

export type ToolArgs = ReadFileToolArgs | WriteToFileToolArgs | InsertContentToolArgs | SearchAndReplaceToolArgs | ListFilesToolArgs | RegexSearchFilesToolArgs | SemanticSearchFilesToolArgs | SearchWebToolArgs | FetchUrlsContentToolArgs | SwitchModeToolArgs;
