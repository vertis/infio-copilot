import { CornerDownLeftIcon } from 'lucide-react'

export function SubmitButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="infio-chat-user-input-submit-button" onClick={onClick}>
      <div>submit</div>
      <div className="infio-chat-user-input-submit-button-icons">
        <CornerDownLeftIcon size={12} />
      </div>
    </button>
  )
}
