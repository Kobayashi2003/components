import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { CSSProperties, Ref } from 'react'

const DEFAULT_GLYPHS = '$#@/\\|=+*%▒░'

interface GlitchBand {
  top: number
  bottom: number
  shift: number
}

interface GlitchFrame {
  text: string
  opacity: number
  bands: [GlitchBand, GlitchBand]
}

export interface AsciiGlitchHandle {
  trigger: () => void
}

export interface AsciiGlitchProps {
  ref?: Ref<AsciiGlitchHandle>
  text: string
  duration?: number
  intensity?: number
  glyphs?: string
  shift?: number
  scanlines?: boolean
  flicker?: boolean
  triggerOnHover?: boolean
  loopInterval?: number
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

function corruptText(text: string, glyphs: string, amount: number) {
  const available = [...glyphs].filter((glyph) => glyph.trim())
  const characters = [...text]
  const targets = characters.flatMap((character, index) => (/\s/.test(character) ? [] : [index]))
  if (!available.length || !targets.length || amount <= 0) return text

  const count = Math.min(targets.length, Math.max(1, Math.round(targets.length * amount)))
  for (let index = 0; index < count; index += 1) {
    const target = index + Math.floor(Math.random() * (targets.length - index))
    const position = targets[index]
    targets[index] = targets[target]
    targets[target] = position
    characters[targets[index]] = available[Math.floor(Math.random() * available.length)]
  }
  return characters.join('')
}

function randomBand(maxShift: number): GlitchBand {
  const top = 8 + Math.random() * 70
  const height = 4 + Math.random() * 17
  return {
    top,
    bottom: Math.min(100, top + height),
    shift: (Math.random() > 0.5 ? 1 : -1) * Math.random() * maxShift,
  }
}

export function AsciiGlitch({
  text,
  duration = 600,
  intensity = 0.7,
  glyphs = DEFAULT_GLYPHS,
  shift = 18,
  scanlines = true,
  flicker = true,
  triggerOnHover = true,
  loopInterval,
  disabled = false,
  className = '',
  style,
  ref,
}: AsciiGlitchProps) {
  const [frame, setFrame] = useState<GlitchFrame | null>(null)
  const animationRef = useRef(0)
  const latestTextRef = useRef(text)

  useEffect(() => {
    latestTextRef.current = text
  }, [text])

  const trigger = useCallback(() => {
    if (typeof window === 'undefined') return
    if (disabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cancelAnimationFrame(animationRef.current)
      setFrame(null)
      return
    }

    cancelAnimationFrame(animationRef.current)
    const start = performance.now()
    const length = Math.max(120, duration)
    const power = Math.max(0, Math.min(1, intensity))
    if (power === 0) {
      setFrame(null)
      return
    }
    let lastFrame = -Infinity

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / length)
      if (progress >= 1) {
        setFrame(null)
        animationRef.current = 0
        return
      }

      if (now - lastFrame >= 32) {
        const envelope = Math.sin(progress * Math.PI)
        const amount = power * envelope
        setFrame({
          text: corruptText(latestTextRef.current, glyphs, amount * 0.48),
          opacity: flicker ? 1 - Math.random() * amount * 0.45 : 1,
          bands: [randomBand(shift * amount), randomBand(shift * amount)],
        })
        lastFrame = now
      }
      animationRef.current = requestAnimationFrame(tick)
    }

    animationRef.current = requestAnimationFrame(tick)
  }, [disabled, duration, flicker, glyphs, intensity, shift])

  useImperativeHandle(ref, () => ({ trigger }), [trigger])

  useEffect(() => {
    if (disabled || !loopInterval || loopInterval <= 0) return
    const timer = window.setInterval(trigger, Math.max(duration + 100, loopInterval))
    return () => window.clearInterval(timer)
  }, [disabled, duration, loopInterval, trigger])

  useEffect(() => () => cancelAnimationFrame(animationRef.current), [])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const stop = () => {
      if (!preference.matches) return
      cancelAnimationFrame(animationRef.current)
      setFrame(null)
    }
    preference.addEventListener('change', stop)
    return () => preference.removeEventListener('change', stop)
  }, [])

  const visibleText = (!disabled && frame?.text) || text
  const classes = [
    'ascii-glitch',
    frame && !disabled ? 'ascii-glitch--active' : '',
    scanlines ? 'ascii-glitch--scanlines' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={classes}
      style={style}
      onPointerEnter={triggerOnHover && !disabled ? trigger : undefined}
    >
      <span className="ascii-glitch__accessible">{text}</span>
      <span
        className="ascii-glitch__visual"
        aria-hidden="true"
        style={{ opacity: disabled ? 1 : (frame?.opacity ?? 1) }}
      >
        <span className="ascii-glitch__base">{visibleText}</span>
        {shift > 0 &&
          !disabled &&
          frame?.bands.map((band, index) => (
            <span
              className="ascii-glitch__band"
              key={index}
              style={{
                clipPath: `inset(${band.top}% 0 ${100 - band.bottom}% 0)`,
                transform: `translateX(${band.shift}px)`,
              }}
            >
              {visibleText}
            </span>
          ))}
      </span>
    </span>
  )
}
