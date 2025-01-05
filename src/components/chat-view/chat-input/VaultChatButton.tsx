import * as Tooltip from '@radix-ui/react-tooltip'
import {
	ArrowBigUp,
	ChevronUp,
	Command,
	CornerDownLeftIcon,
} from 'lucide-react'
import { Platform } from 'obsidian'

export function VaultChatButton({ onClick }: { onClick: () => void }) {
	return (
		<>
			<Tooltip.Provider delayDuration={0}>
				<Tooltip.Root>
					<Tooltip.Trigger asChild>
						<button
							className="infio-chat-user-input-vault-button"
							onClick={onClick}
						>
							<div>vault</div>
							<div className="infio-chat-user-input-vault-button-icons">
								{Platform.isMacOS ? (
									<Command size={10} />
								) : (
									<ChevronUp size={12} />
								)}
								{/* TODO: Replace with a custom icon */}
								{/* <ArrowBigUp size={12} /> */}
								<CornerDownLeftIcon size={12} />
							</div>
						</button>
					</Tooltip.Trigger>
					<Tooltip.Portal>
						<Tooltip.Content className="infio-tooltip-content" sideOffset={5}>
							Chat with your entire vault
						</Tooltip.Content>
					</Tooltip.Portal>
				</Tooltip.Root>
			</Tooltip.Provider>
		</>
	)
}
