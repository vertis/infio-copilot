import React, { useMemo } from 'react'
import Markdown from 'react-markdown'

import {
	InfioBlockAction,
	ParsedInfioBlock,
	parseinfioBlocks,
} from '../../utils/parse-infio-block'

import MarkdownActionBlock from './MarkdownActionBlock'
import MarkdownReferenceBlock from './MarkdownReferenceBlock'

function ReactMarkdown({
	onApply,
	isApplying,
	children,
}: {
	onApply: (blockInfo: {
		content: string
		filename?: string
		startLine?: number
		endLine?: number
	}) => void
	children: string
	isApplying: boolean
}) {
	const blocks: ParsedInfioBlock[] = useMemo(
		() => parseinfioBlocks(children),
		[children],
	)

	return (
		<>
			{blocks.map((block, index) =>
				block.type === 'string' ? (
					<Markdown key={index} className="infio-markdown">
						{block.content}
					</Markdown>
				) : block.startLine && block.endLine && block.filename && block.action === InfioBlockAction.Reference ? (
					<MarkdownReferenceBlock
						key={index}
						filename={block.filename}
						startLine={block.startLine}
						endLine={block.endLine}
					/>
				) : (
					<MarkdownActionBlock
						key={index}
						onApply={onApply}
						isApplying={isApplying}
						language={block.language}
						filename={block.filename}
						startLine={block.startLine}
						endLine={block.endLine}
						action={block.action}
					>
						{block.content}
					</MarkdownActionBlock>
				),
			)}
		</>
	)
}

export default React.memo(ReactMarkdown)
