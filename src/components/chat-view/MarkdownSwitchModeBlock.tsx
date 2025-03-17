import { Check, Loader2, Settings2, X } from 'lucide-react'
import { PropsWithChildren, useState } from 'react'

import { useDarkModeContext } from '../../contexts/DarkModeContext'
import { ApplyStatus, ToolArgs } from '../../types/apply'

import { MemoizedSyntaxHighlighterWrapper } from './SyntaxHighlighterWrapper'

export default function MarkdownSwitchModeBlock({
	mode,
	applyStatus,
	onApply,
	reason,
	finish,
}: PropsWithChildren<{
	mode: string
	applyStatus: ApplyStatus
	onApply: (args: ToolArgs) => void
	reason: string
	finish: boolean
}>) {
	const [applying, setApplying] = useState(false)
	const { isDarkMode } = useDarkModeContext()

	const handleApply = async () => {
		if (applyStatus !== ApplyStatus.Idle) {
			return
		}
		setApplying(true)
		onApply({
			type: 'switch_mode',
			mode: mode,
			reason: reason,
			finish: finish,
		})
	}

	return (
		<div className={`infio-chat-code-block has-filename`}>
			<div className={'infio-chat-code-block-header'}>
				<div className={'infio-chat-code-block-header-filename'}>
					<Settings2 size={10} className="infio-chat-code-block-header-icon" />
					Switch to &quot;{mode.charAt(0).toUpperCase() + mode.slice(1)}&quot; mode
				</div>
				<div className={'infio-chat-code-block-header-button'}>
					<button
						onClick={handleApply}
						style={{ color: '#008000' }}
						disabled={applyStatus !== ApplyStatus.Idle || applying}
					>
						{applyStatus === ApplyStatus.Idle ? (
							applying ? (
								<>
									<Loader2 className="spinner" size={14} /> Allowing...
								</>
							) : (
								'Allow'
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
			<MemoizedSyntaxHighlighterWrapper
				isDarkMode={isDarkMode}
				language="markdown"
				hasFilename={true}
				wrapLines={true}
				isOpen={true}
			>
				{reason}
			</MemoizedSyntaxHighlighterWrapper>
		</div>
	)
}
