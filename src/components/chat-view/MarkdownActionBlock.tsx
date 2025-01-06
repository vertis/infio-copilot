import { Check, CopyIcon, Loader2 } from 'lucide-react'
import { PropsWithChildren, useMemo, useState } from 'react'

import { useDarkModeContext } from '../../contexts/DarkModeContext'

import { MemoizedSyntaxHighlighterWrapper } from './SyntaxHighlighterWrapper'

export default function MarkdownActionBlock({
  onApply,
  isApplying,
  language,
  filename,
  startLine,
  endLine,
  action,
  children,
}: PropsWithChildren<{
  onApply: (blockInfo: {
    content: string
    filename?: string
    startLine?: number
    endLine?: number
  }) => void
  isApplying: boolean
  language?: string
  filename?: string
  startLine?: number
  endLine?: number
  action?: 'edit' | 'new' | 'reference'
}>) {
  const [copied, setCopied] = useState(false)
  const { isDarkMode } = useDarkModeContext()

  const wrapLines = useMemo(() => {
    return !language || ['markdown'].includes(language)
  }, [language])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(children))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className={`infio-chat-code-block ${filename ? 'has-filename' : ''} ${action ? `type-${action}` : ''}`}>
      <div className={'infio-chat-code-block-header'}>
        {filename && (
          <div className={'infio-chat-code-block-header-filename'}>{filename}</div>
        )}
        <div className={'infio-chat-code-block-header-button'}>
          <button
            onClick={() => {
              handleCopy()
            }}
          >
            {copied ? (
              <>
                <Check size={10} /> Copied
              </>
            ) : (
              <>
                <CopyIcon size={10} /> Copy
              </>
            )}
          </button>
          {action === 'edit' && (
            <button
              onClick={() => {
                onApply({
                  content: String(children),
                  filename,
                  startLine,
                  endLine
                })
              }}
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <Loader2 className="spinner" size={14} /> Applying...
                </>
              ) : (
                'Apply'
              )}
            </button>
          )}
          {action === 'new' && (
            <button
              onClick={() => {
                onApply({
                  content: String(children),
                  filename
                })
              }}
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <Loader2 className="spinner" size={14} /> Inserting...
                </>
              ) : (
                'Insert'
              )}
            </button>
          )}
        </div>
      </div>
      <MemoizedSyntaxHighlighterWrapper
        isDarkMode={isDarkMode}
        language={language}
        hasFilename={!!filename}
        wrapLines={wrapLines}
      >
        {String(children)}
      </MemoizedSyntaxHighlighterWrapper>
    </div>
  )
}
