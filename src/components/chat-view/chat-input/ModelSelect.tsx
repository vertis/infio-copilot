import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useSettings } from '../../../contexts/SettingsContext'
import { GetProviderModelIds } from "../../../utils/api"

export function ModelSelect() {
	const { settings, setSettings } = useSettings()
	const [isOpen, setIsOpen] = useState(false)
	const [chatModelId, setChatModelId] = useState(settings.chatModelId)
	const [providerModels, setProviderModels] = useState<string[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const fetchModels = async () => {
			setIsLoading(true)
			try {
				const models = await GetProviderModelIds(settings.chatModelProvider)
				setProviderModels(models)
				setChatModelId(settings.chatModelId)
			} catch (error) {
				console.error('Failed to fetch provider models:', error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchModels()
	}, [settings])

	return (
		<DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenu.Trigger className="infio-chat-input-model-select">
				<div className="infio-chat-input-model-select__icon">
					{isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
				</div>
				<div className="infio-chat-input-model-select__model-name">
					{chatModelId}
				</div>
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className="infio-popover">
					<ul>
						{isLoading ? (
							<li>Loading...</li>
						) : (
							providerModels.map((modelId) => (
								<DropdownMenu.Item
									key={modelId}
									onSelect={() => {
										setChatModelId(modelId)
										setSettings({
											...settings,
											chatModelId: modelId,
										})
									}}
									asChild
								>
									<li>{modelId}</li>
								</DropdownMenu.Item>
							))
						)}
					</ul>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	)
}
