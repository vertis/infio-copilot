import { Search } from 'lucide-react'
import React from 'react'

import { useSettings } from '../../contexts/SettingsContext'
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

	const { settings } = useSettings()

	const handleClick = () => {
		if (settings.serperSearchEngine === 'google') {
			window.open(`https://www.google.com/search?q=${query}`, '_blank')
		} else if (settings.serperSearchEngine === 'bing') {
			window.open(`https://www.bing.com/search?q=${query}`, '_blank')
		} else {
			window.open(`https://duckduckgo.com/?q=${query}`, '_blank')
		}
	}

	React.useEffect(() => {
		if (finish && applyStatus === ApplyStatus.Idle) {
			onApply({
				type: 'search_web',
				query: query,
			})
		}
	}, [finish])

	return (
		<div
			className={`infio-chat-code-block has-filename`
			}
			onClick={handleClick}
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
