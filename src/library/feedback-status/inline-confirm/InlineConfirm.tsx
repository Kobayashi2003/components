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
  const countdown = useRef({ deadline: 0, remaining: 0, paused: false })
  const mounted = useRef(true)
  const busy = useRef(false)
  const [paused, setPaused] = useState(false)
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
  const expire = () => {
    const restoreFocus = root.current?.contains(document.activeElement)
    setPhase('idle')
    setError('')
    setPaused(false)
    if (restoreFocus) focusFirst()
  }
  const startCountdown = () => {
    const state = countdown.current
    clearTimeout(timer.current)
    state.paused = false
    state.deadline = Date.now() + state.remaining
    timer.current = setTimeout(expire, state.remaining)
    setPaused(false)
  }
  // Hover and focus hold the Undo window open so slower users are not timed out.
  const holdCountdown = (hold: boolean) => {
    const state = countdown.current
    if (phase !== 'done' || undoDuration <= 0 || hold === state.paused) return
    if (hold) {
      clearTimeout(timer.current)
      state.remaining = Math.max(0, state.deadline - Date.now())
      state.paused = true
      setPaused(true)
    } else startCountdown()
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
        if (undoDuration > 0) {
          countdown.current = { deadline: 0, remaining: undoDuration, paused: false }
          startCountdown()
        }
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
      className={['atlas-control', 'inline-confirm', className].filter(Boolean).join(' ')}
      style={style}
      data-paused={paused}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') holdCountdown(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse' && !root.current?.contains(document.activeElement))
          holdCountdown(false)
      }}
      onFocus={(event) => {
        if (event.target.matches(':focus-visible')) holdCountdown(true)
      }}
      onBlur={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget) &&
          !event.currentTarget.matches(':hover')
        )
          holdCountdown(false)
      }}
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
