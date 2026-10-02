import { useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import { useTickWave } from './hooks/useTickWave'

export interface RangeDialProps {
  label?: string
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  density?: number
  sweep?: number
  wave?: number
  color?: string
  trackColor?: string
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

function clamp(value: number, min: number, max: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min
}

export function RangeDial({
  label = 'Humidity',
  value,
  defaultValue = 62,
  onChange,
  density = 60,
  sweep = 300,
  wave = 2.6,
  color,
  trackColor = '#505254',
  disabled = false,
  className = '',
  style,
}: RangeDialProps) {
  const [internal, setInternal] = useState(defaultValue)
  const [dragging, setDragging] = useState(false)
  const gesture = useRef<{ id: number; angle: number; raw: number } | null>(null)
  const current = Math.round(clamp(value ?? internal, 0, 100))
  const count = Math.round(clamp(density, 20, 100))
  const arc = clamp(sweep, 180, 330)
  const amplitude = clamp(wave, 0, 5)
  const startAngle = 90 + (360 - arc) / 2
  const accent =
    color ??
    (current < 10 ? '#ff574f' : current < 30 ? '#ffa719' : current < 70 ? '#35d583' : '#528fff')
  const barsRef = useTickWave(count, current / 100, amplitude, dragging && !disabled, disabled)

  const commit = (next: number) => {
    const result = Math.round(clamp(next, 0, 100))
    if (value === undefined) setInternal(result)
    if (result !== current) onChange?.(result)
  }

  const angleAt = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - box.left - box.width / 2
    const y = event.clientY - box.top - box.height / 2
    return Math.hypot(x, y) < Math.min(box.width, box.height) * 0.12
      ? null
      : (Math.atan2(y, x) * 180) / Math.PI
  }

  const finish = (event: PointerEvent<HTMLDivElement>) => {
    if (gesture.current?.id !== event.pointerId) return
    gesture.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const values: Record<string, number> = {
      ArrowUp: current + 1,
      ArrowRight: current + 1,
      ArrowDown: current - 1,
      ArrowLeft: current - 1,
      PageUp: current + 10,
      PageDown: current - 10,
      Home: 0,
      End: 100,
    }
    if (!Object.hasOwn(values, event.key)) return
    event.preventDefault()
    commit(values[event.key])
  }

  return (
    <div
      className={`range-dial ${className}`}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={current}
      aria-valuetext={`${current}%`}
      aria-disabled={disabled}
      data-dragging={dragging && !disabled ? '' : undefined}
      style={
        {
          '--range-dial-color': accent,
          '--range-dial-track': trackColor,
          ...style,
        } as CSSProperties
      }
      onKeyDown={keyboard}
      onPointerDown={(event) => {
        if (disabled || !event.isPrimary || event.button !== 0 || gesture.current) return
        const angle = angleAt(event)
        if (angle === null) return
        event.preventDefault()
        event.currentTarget.focus()
        event.currentTarget.setPointerCapture(event.pointerId)
        const offset = (angle - startAngle + 720) % 360
        // The bottom gap snaps to the nearest endpoint.
        const raw = offset <= arc ? (offset / arc) * 100 : offset - arc < 360 - offset ? 100 : 0
        gesture.current = { id: event.pointerId, angle, raw }
        setDragging(true)
        commit(raw)
      }}
      onPointerMove={(event) => {
        const drag = gesture.current
        if (!drag || drag.id !== event.pointerId) return
        if (disabled) {
          finish(event)
          return
        }
        const angle = angleAt(event)
        if (angle === null) return
        const delta = ((angle - drag.angle + 540) % 360) - 180
        drag.angle = angle
        drag.raw = clamp(drag.raw + (delta / arc) * 100, 0, 100)
        commit(drag.raw)
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
    >
      <svg viewBox="0 0 400 400" aria-hidden="true" focusable="false">
        {Array.from({ length: count }, (_, index) => {
          const angle = startAngle + (index / (count - 1)) * arc
          return (
            <g key={index} transform={`translate(200 200) rotate(${angle})`}>
              <line
                x1="112"
                y1="0"
                x2="166"
                y2="0"
                ref={(node) => {
                  barsRef.current[index] = node
                }}
                style={{
                  stroke:
                    index < Math.round((current / 100) * count)
                      ? 'var(--range-dial-color)'
                      : 'var(--range-dial-track)',
                }}
              />
            </g>
          )
        })}
        <text x="200" y="204" textAnchor="middle" dominantBaseline="middle">
          {current}%
        </text>
      </svg>
    </div>
  )
}
