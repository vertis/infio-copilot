import { Check, Edit, Loader2, X } from 'lucide-react'
import { PropsWithChildren, useState } from 'react'

import { useDarkModeContext } from '../../contexts/DarkModeContext'
import { ApplyStatus, ToolArgs } from '../../types/apply'

import { MemoizedSyntaxHighlighterWrapper } from './SyntaxHighlighterWrapper'

export default function MarkdownApplyDiffBlock({
	mode,
	applyStatus,
	onApply,
	path,
	diff,
	finish,
}: PropsWithChildren<{
	mode: string
	applyStatus: ApplyStatus
	onApply: (args: ToolArgs) => void
	path: string
	diff: string
	finish: boolean
}>) {
	const [applying, setApplying] = useState(false)
	const { isDarkMode } = useDarkModeContext()

	console.log('MarkdownApplyDiffBlock', { mode, applyStatus, onApply, path, diff, finish })
	const handleApply = async () => {
		if (applyStatus !== ApplyStatus.Idle) {
			return
		}
		setApplying(true)
		onApply({
			type: "apply_diff",
			filepath: path,
			diff,
			finish,
		})
	}

	return (
		<div className={`infio-chat-code-block ${path ? 'has-filename' : ''} infio-reasoning-block`}>
			<div className={'infio-chat-code-block-header'}>
				{path && (
					<div className={'infio-chat-code-block-header-filename'}>
						<Edit size={10} className="infio-chat-code-block-header-icon" />
						{mode}: {path}
					</div>
				)}
				<div className={'infio-chat-code-block-header-button'}>
					<button
						onClick={handleApply}
						style={{ color: '#008000' }}
						disabled={applyStatus !== ApplyStatus.Idle || applying || !finish}
					>
						{
							!finish ? (
								<>
									<Loader2 className="spinner" size={14} /> Loading...
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
					language="diff"
					hasFilename={!!path}
					wrapLines={true}
				>
					{diff}
				</MemoizedSyntaxHighlighterWrapper>
			</div>
		</div>
	)
}
