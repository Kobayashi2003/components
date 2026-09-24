import { useLayoutEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { ControlIcon } from './internal/ControlIcon'
import { useControlState } from './internal/useControlState'

export interface NotifyButtonProps {
  value?: boolean
  defaultValue?: boolean
  onChange?: (enabled: boolean) => void
  label?: string
  activeLabel?: string
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

export function NotifyButton({
  value,
  defaultValue = false,
  onChange,
  label = 'Notify me',
  activeLabel = 'You’ll be notified',
  disabled = false,
  className = '',
  style,
}: NotifyButtonProps) {
  const [enabled, update] = useControlState(value, defaultValue, onChange)
  const box = useRef<HTMLSpanElement>(null)
  const off = useRef<HTMLSpanElement>(null)
  const on = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const text = enabled ? on.current : off.current
    if (!text || !box.current) return
    const measure = () => {
      if (box.current) box.current.style.width = `${text.getBoundingClientRect().width}px`
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(text)
    return () => observer.disconnect()
  }, [enabled, label, activeLabel])
  return (
    <div className={`atlas-control notify-button ${className}`} style={style}>
      <button
        type="button"
        aria-pressed={enabled}
        aria-label={enabled ? activeLabel : label}
        disabled={disabled}
        onClick={() => update(!enabled)}
      >
        <span className="notify-button__bell" data-ringing={enabled}>
          <ControlIcon name="bell" size={18} />
        </span>
        <span ref={box} className="notify-button__words" aria-hidden="true">
          <span ref={off} data-visible={!enabled}>
            {label}
          </span>
          <span ref={on} data-visible={enabled}>
            {activeLabel}
          </span>
        </span>
      </button>
    </div>
  )
}
