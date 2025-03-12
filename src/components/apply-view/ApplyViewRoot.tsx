import { Change, diffLines } from 'diff'
import { CheckIcon, X } from 'lucide-react'
import { Platform, getIcon } from 'obsidian'
import { useEffect, useState } from 'react'

import { ApplyViewState } from '../../ApplyView'
import { useApp } from '../../contexts/AppContext'

export default function ApplyViewRoot({
  state,
  close,
}: {
  state: ApplyViewState
  close: () => void
}) {
  const acceptIcon = getIcon('check')
  const rejectIcon = getIcon('x')
  const excludeIcon = getIcon('x')

  const getShortcutText = (shortcut: 'accept' | 'reject') => {
    const isMac = Platform.isMacOS
    if (shortcut === 'accept') {
      return isMac ? '(⌘⏎)' : '(Ctrl+⏎)'
    }
    return isMac ? '(⌘⌫)' : '(Ctrl+⌫)'
  }

  const app = useApp()

  const [diff, setDiff] = useState<Change[]>(
    diffLines(state.originalContent, state.newContent),
  )

  const handleAccept = async () => {
    const newContent = diff
      .filter((change) => !change.removed)
      .map((change) => change.value)
      .join('')
    await app.vault.modify(state.file, newContent)
    if (state.onClose) {
      state.onClose(true)
    }
    close()
  }

  const handleReject = async () => {
    if (state.onClose) {
      state.onClose(false)
    }
    close()
  }

  const excludeDiffLine = (index: number) => {
    setDiff((prevDiff) => {
      const newDiff = [...prevDiff]
      const change = newDiff[index]
      if (change.added) {
        // Remove the entry if it's an added line
        return newDiff.filter((_, i) => i !== index)
      } else if (change.removed) {
        change.removed = false
      }
      return newDiff
    })
  }

  const acceptDiffLine = (index: number) => {
    setDiff((prevDiff) => {
      const newDiff = [...prevDiff]
      const change = newDiff[index]
      if (change.added) {
        change.added = false
      } else if (change.removed) {
        // Remove the entry if it's a removed line
        return newDiff.filter((_, i) => i !== index)
      }
      return newDiff
    })
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const modifierKey = Platform.isMacOS ? event.metaKey : event.ctrlKey;
    if (modifierKey) {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        handleAccept();
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        event.stopPropagation();
        handleReject();
      }
    }
  }

  // 在组件挂载时添加事件监听器，在卸载时移除
  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyDown(e);
    window.addEventListener('keydown', handler, true);
    return () => {
      window.removeEventListener('keydown', handler, true);
    }
  }, [handleAccept, handleReject]) // 添加handleAccept和handleReject作为依赖项

  return (
    <div id="infio-apply-view">
      <div className="view-header">
        <div className="view-header-left">
          <div className="view-header-nav-buttons"></div>
        </div>
        <div className="view-header-title-container mod-at-start">
          <div className="view-header-title">
            Applying: {state?.file?.name ?? ''}
          </div>
          <div className="view-actions">
            <button
              className="clickable-icon view-action infio-approve-button"
              aria-label="Accept changes"
              onClick={handleAccept}
            >
              {acceptIcon && <CheckIcon size={14} />}
              Accept {getShortcutText('accept')}
            </button>
            <button
              className="clickable-icon view-action infio-reject-button"
              aria-label="Reject changes"
              onClick={handleReject}
            >
              {rejectIcon && <X size={14} />}
              Reject {getShortcutText('reject')}
            </button>
          </div>
        </div>
      </div>

      <div className="view-content">
        <div className="markdown-source-view cm-s-obsidian mod-cm6 node-insert-event is-readable-line-width is-live-preview is-folding show-properties">
          <div className="cm-editor">
            <div className="cm-scroller">
              <div className="cm-sizer">
                <div className="infio-inline-title">
                  {state?.file?.name
                    ? state.file.name.replace(/\.[^/.]+$/, '')
                    : ''}
                </div>

                {diff.map((part, index) => (
                  <div
                    key={index}
                    className={`infio-diff-line ${part.added ? 'added' : part.removed ? 'removed' : ''}`}
                  >
                    <div style={{ width: '100%' }}>{part.value}</div>
                    {(part.added || part.removed) && (
                      <div className="infio-diff-line-actions">
                        <button
                          aria-label="Accept line"
                          onClick={() => acceptDiffLine(index)}
                          className="infio-accept"
                        >
                          {acceptIcon && 'Y'}
                        </button>
                        <button
                          aria-label="Exclude line"
                          onClick={() => excludeDiffLine(index)}
                          className="infio-exclude"
                        >
                          {excludeIcon && 'N'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
