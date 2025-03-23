import { Check, Loader2, Replace, X } from 'lucide-react'
import React from 'react'

import { useApp } from '../../contexts/AppContext'
import { useDarkModeContext } from '../../contexts/DarkModeContext'
import { ApplyStatus, SearchAndReplaceToolArgs } from '../../types/apply'
import { openMarkdownFile } from '../../utils/obsidian'

import { MemoizedSyntaxHighlighterWrapper } from './SyntaxHighlighterWrapper'

export default function MarkdownSearchAndReplace({
	applyStatus,
	onApply,
	path,
	content,
	operations,
	finish
}: {
	applyStatus: ApplyStatus
	onApply: (args: SearchAndReplaceToolArgs) => void
	path: string,
	content: string,
	operations: SearchAndReplaceToolArgs['operations'],
	finish: boolean
}) {
	const app = useApp()
	const { isDarkMode } = useDarkModeContext()

	const [applying, setApplying] = React.useState(false)

	const handleClick = () => {
		openMarkdownFile(app, path)
	}

	const handleApply = async () => {
		if (applyStatus !== ApplyStatus.Idle) {
			return
		}
		setApplying(true)
		onApply({
			type: 'search_and_replace',
			filepath: path,
			operations
		})
	}

	return (
		<div
			className={`infio-chat-code-block ${path ? 'has-filename' : ''}  infio-reasoning-block`}
			onClick={handleClick}
		>
			<div className={'infio-chat-code-block-header'}>
				<div className={'infio-chat-code-block-header-filename'}>
					<Replace size={10} className="infio-chat-code-block-header-icon" />
					Search and replace in {path}
				</div>
				<div className={'infio-chat-code-block-header-button'}>
					<button
						onClick={handleApply}
						disabled={applyStatus !== ApplyStatus.Idle || applying || !finish}
					>
						{!finish ? (
							<>
								<Loader2 className="spinner" size={14} />
							</>
						) : applyStatus === ApplyStatus.Idle ? (
							applying ? (
								<>
									<Loader2 className="spinner" size={14} /> Applying...
								</>
							) : (
								'Apply'
							)
						) : applyStatus === ApplyStatus.Applied ? (
							<>
								<Check size={14} /> Success
							</>
						) : (
							<>
								<X size={14} /> Failed
							</>
						)}
					</button>
				</div>
			</div>
			<div className="infio-reasoning-content-wrapper">
				<MemoizedSyntaxHighlighterWrapper
					isDarkMode={isDarkMode}
					language="markdown"
					hasFilename={!!path}
					wrapLines={true}
				>
					{content}
				</MemoizedSyntaxHighlighterWrapper>
			</div>
		</div>
	)
} 
