import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { ControlIcon } from './internal/ControlIcon'

export interface SlideToConfirmProps {
  onConfirm?: () => void
  label?: string
  confirmedLabel?: string
  resetAfter?: number
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

export function SlideToConfirm({
  onConfirm,
  label = 'Slide to confirm',
  confirmedLabel = 'Confirmed',
  resetAfter = 1800,
  disabled = false,
  className = '',
  style,
}: SlideToConfirmProps) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [dragging, setDragging] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ id: number; start: number; travel: number; progress: number } | null>(
    null,
  )
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const confirm = () => {
    if (done || disabled) return
    setDone(true)
    setProgress(0)
    onConfirm?.()
    if (resetAfter > 0) timer.current = setTimeout(() => setDone(false), resetAfter)
  }
  const finish = (event: PointerEvent<HTMLButtonElement>, cancel = false) => {
    const drag = gesture.current
    if (!drag || drag.id !== event.pointerId) return
    gesture.current = null
    setDragging(false)
    if (!cancel && !disabled && drag.progress >= 0.98) confirm()
    else setProgress(0)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }
  return (
    <div
      className={`atlas-control slide-confirm ${className}`}
      style={{ '--slide-progress': disabled ? 0 : progress, ...style } as CSSProperties}
      data-done={done}
      data-dragging={dragging && !disabled}
    >
      <div ref={track} className="slide-confirm__track">
        <span className="slide-confirm__wash" aria-hidden="true" />
        <span className="slide-confirm__label" aria-hidden="true">
          {label}
        </span>
        <button
          type="button"
          className="slide-confirm__thumb"
          aria-label={done ? confirmedLabel : label}
          aria-disabled={done || disabled}
          disabled={disabled}
          onClick={(event) => {
            if (event.detail === 0) confirm()
          }}
          onPointerDown={(event) => {
            if (done || disabled || !event.isPrimary || event.button !== 0 || gesture.current)
              return
            const box = track.current?.getBoundingClientRect()
            if (!box || !track.current) return
            event.preventDefault()
            event.currentTarget.setPointerCapture(event.pointerId)
            const scale = box.width / track.current.offsetWidth
            gesture.current = {
              id: event.pointerId,
              start: event.clientX,
              travel: Math.max(1, box.width - 56 * scale),
              progress: 0,
            }
            setDragging(true)
          }}
          onPointerMove={(event) => {
            const drag = gesture.current
            if (!drag || drag.id !== event.pointerId) return
            if (disabled) {
              finish(event, true)
              return
            }
            drag.progress = Math.min(1, Math.max(0, (event.clientX - drag.start) / drag.travel))
            setProgress(drag.progress)
          }}
          onPointerUp={(event) => finish(event)}
          onPointerCancel={(event) => finish(event, true)}
          onLostPointerCapture={(event) => finish(event, true)}
        >
          {done ? (
            <>
              <ControlIcon name="check" />
              {confirmedLabel}
            </>
          ) : (
            <ControlIcon name="arrow" />
          )}
        </button>
      </div>
      <span className="slide-confirm__status" role="status">
        {done ? confirmedLabel : ''}
      </span>
    </div>
  )
}
