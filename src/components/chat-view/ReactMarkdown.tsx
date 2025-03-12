import React, { useMemo } from 'react'
import Markdown from 'react-markdown'

import { ApplyStatus, ToolArgs } from '../../types/apply'
import {
	ParsedMsgBlock,
	parseMsgBlocks,
} from '../../utils/parse-infio-block'

import MarkdownEditFileBlock from './MarkdownEditFileBlock'
import MarkdownListFilesBlock from './MarkdownListFilesBlock'
import MarkdownReadFileBlock from './MarkdownReadFileBlock'
import MarkdownReasoningBlock from './MarkdownReasoningBlock'
import MarkdownRegexSearchFilesBlock from './MarkdownRegexSearchFilesBlock'
import MarkdownSearchAndReplace from './MarkdownSearchAndReplace'
import MarkdownSemanticSearchFilesBlock from './MarkdownSemanticSearchFilesBlock'
import MarkdownWithIcons from './MarkdownWithIcon'

function ReactMarkdown({
	applyStatus,
	onApply,
	children,
}: {
	applyStatus: ApplyStatus
	onApply: (toolArgs: ToolArgs) => void
	children: string
}) {
	const blocks: ParsedMsgBlock[] = useMemo(
		() => parseMsgBlocks(children),
		[children],
	)

	return (
		<>
			{blocks.map((block, index) =>
				block.type === 'thinking' ? (
					<Markdown key={"markdown-" + index} className="infio-markdown">
						{block.content}
					</Markdown>
				) : block.type === 'think' ? (
					<MarkdownReasoningBlock
						key={"reasoning-" + index}
						reasoningContent={block.content}
					/>
				) : block.type === 'write_to_file' ? (
					<MarkdownEditFileBlock
						key={"write-to-file-" + index}
						applyStatus={applyStatus}
						mode={block.type}
						onApply={onApply}
						path={block.path}
						startLine={1}
					>
						{block.content}
					</MarkdownEditFileBlock>
				) : block.type === 'insert_content' ? (
					<MarkdownEditFileBlock
						key={"insert-content-" + index}
						applyStatus={applyStatus}
						mode={block.type}
						onApply={onApply}
						path={block.path}
						startLine={block.startLine}
						endLine={block.startLine} // 插入内容时，endLine 和 startLine 相同
					>
						{block.content}
					</MarkdownEditFileBlock>
				) : block.type === 'search_and_replace' ? (
					<MarkdownSearchAndReplace
						key={"search-and-replace-" + index}
						applyStatus={applyStatus}
						onApply={onApply}
						path={block.path}
						operations={block.operations.map(op => ({
							search: op.search,
							replace: op.replace,
							startLine: op.start_line,
							endLine: op.end_line,
							useRegex: op.use_regex,
							ignoreCase: op.ignore_case,
							regexFlags: op.regex_flags,
						}))}
						finish={block.finish}
					/>
				) : block.type === 'read_file' ? (
					<MarkdownReadFileBlock
						key={"read-file-" + index}
						applyStatus={applyStatus}
						onApply={onApply}
						path={block.path}
						finish={block.finish}
					/>
				) : block.type === 'list_files' ? (
					<MarkdownListFilesBlock
						key={"list-files-" + index}
						applyStatus={applyStatus}
						onApply={onApply}
						path={block.path}
						recursive={block.recursive}
						finish={block.finish}
					/>
				) : block.type === 'regex_search_files' ? (
					<MarkdownRegexSearchFilesBlock
						key={"regex-search-files-" + index}
						applyStatus={applyStatus}
						onApply={onApply}
						path={block.path}
						regex={block.regex}
						finish={block.finish}
					/>
				) : block.type === 'semantic_search_files' ? (
					<MarkdownSemanticSearchFilesBlock
						key={"semantic-search-files-" + index}
						applyStatus={applyStatus}
						onApply={onApply}
						path={block.path}
						query={block.query}
						finish={block.finish}
					/>
				) : block.type === 'attempt_completion' ? (
					<MarkdownWithIcons
						key={"attempt-completion-" + index}
						className="infio-markdown infio-attempt-completion"
						markdownContent={
							`<icon name='attempt_completion' size={14} className="infio-markdown-icon" />
						${block.result && block.result.trimStart()}`} />
				) : block.type === 'ask_followup_question' ? (
					<MarkdownWithIcons
						key={"ask-followup-question-" + index}
						className="infio-markdown infio-followup-question"
						markdownContent={
							`<icon name='ask_followup_question' size={14} className="infio-markdown-icon" />
						${block.question && block.question.trimStart()}`} />
				) : (
					<Markdown key={"markdown-" + index} className="infio-markdown">
						{block.content}
					</Markdown>
				),
			)}
		</>
	)
}

export default React.memo(ReactMarkdown)
