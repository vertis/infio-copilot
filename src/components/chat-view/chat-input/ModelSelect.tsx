import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

import { useSettings } from '../../../contexts/SettingsContext'

export function ModelSelect() {
	const { settings, setSettings } = useSettings()
	const [isOpen, setIsOpen] = useState(false)

	const activeModels = settings.activeModels.filter((model) => model.enabled)

	return (
		<DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenu.Trigger className="infio-chat-input-model-select">
				<div className="infio-chat-input-model-select__icon">
					{isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
				</div>
				<div className="infio-chat-input-model-select__model-name">
					{
						activeModels.find(
							(option) => option.name === settings.chatModelId,
						)?.name
					}
				</div>
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className="infio-popover">
					<ul>
						{activeModels.map((model) => (
							<DropdownMenu.Item
								key={model.name}
								onSelect={() => {
									setSettings({
										...settings,
										chatModelId: model.name,
									})
								}}
								asChild
							>
								<li>{model.name}</li>
							</DropdownMenu.Item>
						))}
					</ul>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	)
}
