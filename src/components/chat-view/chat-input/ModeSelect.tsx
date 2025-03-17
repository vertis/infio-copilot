import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useSettings } from '../../../contexts/SettingsContext'
import { modes } from '../../../utils/modes'

export function ModeSelect() {
	const { settings, setSettings } = useSettings()
	const [isOpen, setIsOpen] = useState(false)
	const [mode, setMode] = useState(settings.mode)

	useEffect(() => {
		setMode(settings.mode)
	}, [settings.mode])


	return (
		<DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenu.Trigger className="infio-chat-input-model-select">
				<div className="infio-chat-input-model-select__icon">
					{isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
				</div>
				<div className="infio-chat-input-model-select__model-name">
					{modes.find((m) => m.slug === mode)?.name}
				</div>
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className="infio-popover">
					<ul>
						{modes.map((mode) => (
							<DropdownMenu.Item
								key={mode.slug}
								onSelect={() => {
									setMode(mode.slug)
									setSettings({
										...settings,
										mode: mode.slug,
									})
								}}
								asChild
							>
								<li>{mode.name}</li>
							</DropdownMenu.Item>
						))}
					</ul>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	)
}
