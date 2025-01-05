import * as Tooltip from '@radix-ui/react-tooltip'
import { Check, CopyIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ChatAssistantMessage } from '../../types/chat'
import { calculateLLMCost } from '../../utils/price-calculator'

import LLMResponseInfoPopover from './LLMResponseInfoPopover'

function CopyButton({ message }: { message: ChatAssistantMessage }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1500)
  }

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button>
            {copied ? (
              <Check
                size={12}
                className="infio-chat-message-actions-icon--copied"
              />
            ) : (
              <CopyIcon onClick={handleCopy} size={12} />
            )}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="infio-tooltip-content">
            Copy message
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

function LLMResponesInfoButton({ message }: { message: ChatAssistantMessage }) {
  const cost = useMemo<number | null>(() => {
    if (!message.metadata?.model || !message.metadata?.usage) {
      return 0
    }
    return calculateLLMCost({
      model: message.metadata.model,
      usage: message.metadata.usage,
    })
  }, [message])

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div>
            <LLMResponseInfoPopover
              usage={message.metadata?.usage}
              estimatedPrice={cost}
              model={message.metadata?.model?.name}
            />
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="infio-tooltip-content">
            View details
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

export default function AssistantMessageActions({
  message,
}: {
  message: ChatAssistantMessage
}) {
  return (
    <div className="infio-chat-message-actions">
      <LLMResponesInfoButton message={message} />
      <CopyButton message={message} />
    </div>
  )
}
