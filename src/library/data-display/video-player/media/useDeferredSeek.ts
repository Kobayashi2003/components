import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { RefObject } from 'react'

export function useDeferredSeek(
  mediaRef: RefObject<HTMLMediaElement | null>,
  preview: (time: number) => void,
  commit: (time: number) => void,
) {
  const active = useRef(false)
  const resume = useRef(false)
  const target = useRef(0)
  const origin = useRef(0)
  const [dragging, setDragging] = useState(false)

  function finish(cancel = false, allowResume = true) {
    if (!active.current) return
    active.current = false
    setDragging(false)
    if (cancel) preview(origin.current)
    else commit(target.current)
    if (resume.current && allowResume) void mediaRef.current?.play().catch(() => {})
    resume.current = false
  }

  const cancelOnBlur = useEffectEvent(() => finish(true, false))
  useEffect(() => {
    const blur = () => cancelOnBlur()
    const competingPlay = (event: Event) => {
      if (event.target !== mediaRef.current) resume.current = false
    }
    window.addEventListener('blur', blur)
    document.addEventListener('play', competingPlay, true)
    return () => {
      window.removeEventListener('blur', blur)
      document.removeEventListener('play', competingPlay, true)
    }
  }, [mediaRef])

  return {
    active,
    dragging,
    begin(time: number) {
      if (active.current) return
      active.current = true
      origin.current = target.current = time
      resume.current = !!mediaRef.current && !mediaRef.current.paused
      mediaRef.current?.pause()
      setDragging(true)
    },
    update(time: number) {
      target.current = time
      if (active.current) preview(time)
      else commit(time)
    },
    finish,
  }
}
