import { useEffect, useRef } from 'react'

export function useTickWave(
  count: number,
  progress: number,
  amplitude: number,
  dragging: boolean,
  disabled: boolean,
) {
  const bars = useRef<Array<SVGLineElement | null>>([])
  const springs = useRef<Array<{ position: number; velocity: number }>>([])

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    springs.current = Array.from(
      { length: count },
      (_, index) => springs.current[index] ?? { position: 0, velocity: 0 },
    )
    bars.current.length = count
    let frame = 0
    let previousTime = 0

    const reset = () => {
      springs.current.forEach((spring, index) => {
        spring.position = 0
        spring.velocity = 0
        bars.current[index]?.style.setProperty('--range-dial-scale', '1')
      })
    }

    const update = (time: number) => {
      const elapsed = previousTime ? Math.min((time - previousTime) / 1000, 0.032) : 1 / 60
      previousTime = time
      let moving = false
      springs.current.forEach((spring, index) => {
        const distance = index / (count - 1) - progress
        const target = dragging ? Math.exp((-distance * distance) / 0.008) * amplitude * 5 : 0
        // Independent damped springs leave a short travelling crest behind the drag.
        spring.velocity += ((target - spring.position) * 210 - spring.velocity * 18) * elapsed
        spring.position += spring.velocity * elapsed
        if (Math.abs(target - spring.position) > 0.01 || Math.abs(spring.velocity) > 0.01) {
          moving = true
        } else {
          spring.position = target
          spring.velocity = 0
        }
        bars.current[index]?.style.setProperty(
          '--range-dial-scale',
          String(1 + spring.position / 54),
        )
      })
      if (moving) frame = window.requestAnimationFrame(update)
    }

    const start = () => {
      window.cancelAnimationFrame(frame)
      previousTime = 0
      if (motion.matches || disabled || amplitude === 0 || document.hidden) reset()
      else frame = window.requestAnimationFrame(update)
    }
    start()
    motion.addEventListener('change', start)
    document.addEventListener('visibilitychange', start)
    return () => {
      window.cancelAnimationFrame(frame)
      motion.removeEventListener('change', start)
      document.removeEventListener('visibilitychange', start)
    }
  }, [count, progress, amplitude, dragging, disabled])

  return bars
}
