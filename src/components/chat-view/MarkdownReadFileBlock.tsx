import { ExternalLink } from 'lucide-react'
import React from 'react'

import { useApp } from '../../contexts/AppContext'
import { ApplyStatus, ReadFileToolArgs } from '../../types/apply'
import { openMarkdownFile } from '../../utils/obsidian'

export default function MarkdownReadFileBlock({
	applyStatus,
	onApply,
	path,
	finish
}: {
	applyStatus: ApplyStatus
	onApply: (args: ReadFileToolArgs) => void
	path: string,
	finish: boolean
}) {
	const app = useApp()

	const handleClick = () => {
		openMarkdownFile(app, path)
	}

	React.useEffect(() => {
		console.log('finish', finish, applyStatus)
		if (finish && applyStatus === ApplyStatus.Idle) {
			console.log('finish auto read file', path)
			onApply({
				type: 'read_file',
				filepath: path
			})
		}
	}, [finish])

	return (
		<div
			className={`infio-chat-code-block ${path ? 'has-filename' : ''}`}
			onClick={handleClick}
		>
			<div className={'infio-chat-code-block-header'}>
				<div className={'infio-chat-code-block-header-filename'}>
					<ExternalLink size={10} className="infio-chat-code-block-header-icon" />
					Read file: {path}
				</div>
			</div>
		</div>
	)
} 
