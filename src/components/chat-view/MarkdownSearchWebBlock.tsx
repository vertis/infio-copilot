import { Search } from 'lucide-react'
import React from 'react'

import { ApplyStatus, SearchWebToolArgs } from '../../types/apply'

export default function MarkdownWebSearchBlock({
	applyStatus,
	onApply,
	query,
	finish
}: {
	applyStatus: ApplyStatus
	onApply: (args: SearchWebToolArgs) => void
	query: string,
	finish: boolean
}) {

	React.useEffect(() => {
		console.log('finish', finish, applyStatus)
		if (finish && applyStatus === ApplyStatus.Idle) {
			console.log('finish auto web search', query)
			onApply({
				type: 'search_web',
				query: query,
			})
		}
	}, [finish])

	return (
		<div
			className={`infio-chat-code-block has-filename`}
		>
			<div className={'infio-chat-code-block-header'}>
				<div className={'infio-chat-code-block-header-filename'}>
					<Search size={14} className="infio-chat-code-block-header-icon" />
					Web search: {query}
				</div>
			</div>
		</div>
	)
} 
