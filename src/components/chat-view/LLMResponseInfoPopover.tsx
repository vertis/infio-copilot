import * as Popover from '@radix-ui/react-popover'
import {
	ArrowDown,
	ArrowRightLeft,
	ArrowUp,
	Coins,
	Cpu,
	Info,
} from 'lucide-react'

import { ResponseUsage } from '../../types/llm/response'

type LLMResponseInfoProps = {
	usage?: ResponseUsage
	estimatedPrice: number | null
	model?: string
}

export default function LLMResponseInfoPopover({
	usage,
	estimatedPrice,
	model,
}: LLMResponseInfoProps) {
	return (
		<Popover.Root>
			<Popover.Trigger asChild>
				<button>
					<Info className="infio-llm-info-icon--trigger" size={12} />
				</button>
			</Popover.Trigger>
			{usage ? (
				<Popover.Content className="infio-chat-popover-content infio-llm-info-content">
					<div className="infio-llm-info-header">LLM response information</div>
					<div className="infio-llm-info-tokens">
						<div className="infio-llm-info-tokens-header">Token count</div>
						<div className="infio-llm-info-tokens-grid">
							<div className="infio-llm-info-token-row">
								<ArrowUp className="infio-llm-info-icon--input" />
								<span>Input:</span>
								<span className="infio-llm-info-token-value">
									{usage.prompt_tokens}
								</span>
							</div>
							<div className="infio-llm-info-token-row">
								<ArrowDown className="infio-llm-info-icon--output" />
								<span>Output:</span>
								<span className="infio-llm-info-token-value">
									{usage.completion_tokens}
								</span>
							</div>
							<div className="infio-llm-info-token-row infio-llm-info-token-total">
								<ArrowRightLeft className="infio-llm-info-icon--total" />
								<span>Total:</span>
								<span className="infio-llm-info-token-value">
									{usage.total_tokens}
								</span>
							</div>
						</div>
					</div>
					<div className="infio-llm-info-footer-row">
						<Coins className="infio-llm-info-icon--footer" />
						<span>Estimated price:</span>
						<span className="infio-llm-info-footer-value">
							{estimatedPrice === null
								? 'Not available'
								: `$${estimatedPrice.toFixed(4)}`}
						</span>
					</div>
					<div className="infio-llm-info-footer-row">
						<Cpu className="infio-llm-info-icon--footer" />
						<span>Model:</span>
						<span className="infio-llm-info-footer-value infio-llm-info-model">
							{model ?? 'Not available'}
						</span>
					</div>
				</Popover.Content>
			) : (
				<Popover.Content className="infio-chat-popover-content">
					<div>Usage statistics are not available for this model</div>
				</Popover.Content>
			)}
		</Popover.Root>
	)
}
