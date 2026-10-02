import { useEffect, useRef } from 'react'
import { writePreference } from './preferences'

function createPosition(key: string, time: number) {
  return { key, time, duration: 0, armed: false, lastSaved: 0, playing: false }
}
function flush(position: ReturnType<typeof createPosition>) {
  if (position.armed)
    writePreference(
      position.key,
      position.duration > 0 && position.time >= position.duration - 1 ? 0 : position.time,
    )
}
export function usePlaybackPosition(key: string, initialTime: number) {
  const position = useRef(createPosition(key, initialTime))
  useEffect(() => {
    const record = createPosition(key, initialTime)
    position.current = record
    const save = () => flush(record)
    const visibility = () => {
      if (document.visibilityState === 'hidden') save()
    }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      save()
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [key, initialTime])
  return {
    onPlay() {
      position.current.playing = true
      position.current.armed = true
    },
    onPause() {
      position.current.playing = false
      flush(position.current)
    },
    onTimeChange(time: number, duration: number) {
      const record = position.current
      if (!Number.isFinite(time) || duration <= 0 || (!record.armed && time === 0)) return
      record.armed = true
      record.time = time
      record.duration = duration
      if (!record.playing || Math.abs(time - record.lastSaved) >= 2) {
        record.lastSaved = time
        flush(record)
      }
    },
    onEnded() {
      position.current.time = 0
      position.current.armed = true
      position.current.playing = false
      flush(position.current)
    },
  }
}
