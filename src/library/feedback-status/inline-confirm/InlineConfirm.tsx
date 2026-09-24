import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ControlIcon } from './internal/ControlIcon'

export interface InlineConfirmProps {
  onConfirm?: () => void | Promise<void>
  onUndo?: () => void | Promise<void>
  label?: string
  confirmLabel?: string
  doneLabel?: string
  undoDuration?: number
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

export function InlineConfirm({
  onConfirm,
  onUndo,
  label = 'Delete file',
  confirmLabel = 'Delete',
  doneLabel = 'Deleted',
  undoDuration = 4000,
  disabled = false,
  className = '',
  style,
}: InlineConfirmProps) {
  const [phase, setPhase] = useState<'idle' | 'asking' | 'pending' | 'done'>('idle')
  const [error, setError] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const mounted = useRef(true)
  const busy = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
    }
  }, [])
  const focusFirst = () =>
    requestAnimationFrame(() =>
      root.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus(),
    )
  const reset = () => {
    clearTimeout(timer.current)
    setPhase('idle')
    setError('')
    focusFirst()
  }
  const run = async (undo: boolean) => {
    if (disabled || busy.current) return
    busy.current = true
    clearTimeout(timer.current)
    setPhase('pending')
    setError('')
    try {
      await (undo ? onUndo?.() : onConfirm?.())
      if (!mounted.current) return
      if (undo) reset()
      else {
        setPhase('done')
        focusFirst()
        if (undoDuration > 0)
          timer.current = setTimeout(() => {
            const restoreFocus = root.current?.contains(document.activeElement)
            setPhase('idle')
            setError('')
            if (restoreFocus) focusFirst()
          }, undoDuration)
      }
    } catch {
      if (mounted.current) {
        setPhase(undo ? 'done' : 'asking')
        setError(undo ? 'Could not undo. Try again.' : 'Could not complete. Try again.')
        focusFirst()
      }
    } finally {
      busy.current = false
    }
  }
  return (
    <div
      ref={root}
      className={`atlas-control inline-confirm ${className}`}
      style={style}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && phase === 'asking') {
          event.preventDefault()
          event.stopPropagation()
          reset()
        }
      }}
    >
      <div className="inline-confirm__shell" data-phase={phase} aria-busy={phase === 'pending'}>
        {phase === 'idle' && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setPhase('asking')
              focusFirst()
            }}
          >
            <ControlIcon name="trash" size={16} />
            {label}
          </button>
        )}
        {phase === 'asking' && (
          <>
            <button type="button" disabled={disabled} onClick={reset}>
              Keep
            </button>
            <button
              type="button"
              disabled={disabled}
              className="inline-confirm__danger"
              onClick={() => {
                void run(false)
              }}
            >
              {confirmLabel}
            </button>
          </>
        )}
        {phase === 'pending' && <span role="status">Working…</span>}
        {phase === 'done' && (
          <>
            <span role="status">
              <ControlIcon name="check" size={16} />
              {doneLabel}
            </span>
            {onUndo && (
              <button
                className="inline-confirm__undo"
                type="button"
                disabled={disabled}
                onClick={() => {
                  void run(true)
                }}
              >
                <ControlIcon name="undo" size={15} />
                Undo{undoDuration > 0 && <i style={{ animationDuration: `${undoDuration}ms` }} />}
              </button>
            )}
          </>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
