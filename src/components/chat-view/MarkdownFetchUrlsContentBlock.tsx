import { ChevronDown, ChevronRight, Globe } from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { useDarkModeContext } from '../../contexts/DarkModeContext'
import { ApplyStatus, FetchUrlsContentToolArgs } from '../../types/apply'

import { MemoizedSyntaxHighlighterWrapper } from './SyntaxHighlighterWrapper'

export default function MarkdownFetchUrlsContentBlock({
	applyStatus,
	onApply,
	urls,
	finish
}: {
	applyStatus: ApplyStatus
	onApply: (args: FetchUrlsContentToolArgs) => void
	urls: string[],
	finish: boolean
}) {
	const { isDarkMode } = useDarkModeContext()
	const containerRef = useRef<HTMLDivElement>(null)
	const [isOpen, setIsOpen] = useState(true)

	React.useEffect(() => {
		console.log('finish', finish, applyStatus)
		if (finish && applyStatus === ApplyStatus.Idle) {
			console.log('finish auto fetch urls content', urls)
			onApply({
				type: 'fetch_urls_content',
				urls: urls
			})
		}
	}, [finish])

	const urlsMarkdownContent = useMemo(() => {
		return urls.map(url => {
			return `${url}`
		}).join('\n\n')
	}, [urls])

	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight
		}
	}, [urlsMarkdownContent])

	return (
		urlsMarkdownContent && (
			<div
				className={`infio-chat-code-block has-filename infio-reasoning-block`}
			>
				<div className={'infio-chat-code-block-header'}>
					<div className={'infio-chat-code-block-header-filename'}>
						<Globe size={10} className="infio-chat-code-block-header-icon" />
						Fetch URLs Content
					</div>
					<button
						className="clickable-icon infio-chat-list-dropdown"
						onClick={() => setIsOpen(!isOpen)}
					>
						{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
					</button>
				</div>
				<div
					ref={containerRef}
					className="infio-reasoning-content-wrapper"
				>
					<MemoizedSyntaxHighlighterWrapper
						isDarkMode={isDarkMode}
						language="markdown"
						hasFilename={true}
						wrapLines={true}
						isOpen={isOpen}
					>
						{urlsMarkdownContent}
					</MemoizedSyntaxHighlighterWrapper>
				</div>
			</div>
		)
	)
} 
