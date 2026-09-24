import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { PlayerIcon } from './icons'
import './styles.css'

export interface MorphingAudioPlayerProps {
  title: string
  subtitle: string
  artwork: string
  duration?: number
  initialTime?: number
  initialExpanded?: boolean
  className?: string
  style?: CSSProperties
}

function formatTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds))
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}

export function MorphingAudioPlayer({
  title,
  subtitle,
  artwork,
  duration = 214,
  initialTime = 52,
  initialExpanded = false,
  className = '',
  style,
}: MorphingAudioPlayerProps) {
  const total = Math.max(1, duration)
  const [expanded, setExpanded] = useState(initialExpanded)
  const [playing, setPlaying] = useState(false)
  const [liked, setLiked] = useState(false)
  const [elapsed, setElapsed] = useState(() => Math.min(total, Math.max(0, initialTime)))
  const elapsedRef = useRef(elapsed)
  const seekingRef = useRef(false)

  useEffect(() => {
    if (!playing) return
    let previousTick = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      if (seekingRef.current) {
        previousTick = now
        return
      }
      const next = Math.min(total, elapsedRef.current + (now - previousTick) / 1000)
      previousTick = now
      elapsedRef.current = next
      setElapsed(next)
      if (next >= total) {
        window.clearInterval(timer)
        setPlaying(false)
      }
    }, 100)
    return () => window.clearInterval(timer)
  }, [playing, total])

  function restart() {
    elapsedRef.current = 0
    setElapsed(0)
  }

  function seek(value: number) {
    const next = Math.min(total, Math.max(0, value))
    elapsedRef.current = next
    setElapsed(next)
    if (next >= total) setPlaying(false)
  }

  function togglePlay() {
    if (!playing && elapsedRef.current >= total) restart()
    setPlaying((value) => !value)
  }

  const progress = Math.min(100, (elapsed / total) * 100)

  const controls = (size: 'compact' | 'expanded') => (
    <div className={`morph-audio__transport morph-audio__transport--${size}`}>
      <button type="button" aria-label="Restart" onClick={restart}>
        <PlayerIcon name="previous" size={size === 'compact' ? 22 : 28} />
      </button>
      <button
        className="morph-audio__play"
        type="button"
        aria-label={playing ? 'Pause' : 'Play'}
        aria-pressed={playing}
        onClick={togglePlay}
      >
        <PlayerIcon name={playing ? 'pause' : 'play'} size={size === 'compact' ? 25 : 31} />
      </button>
      <button type="button" aria-label="Next" onClick={restart}>
        <PlayerIcon name="next" size={size === 'compact' ? 22 : 28} />
      </button>
    </div>
  )

  return (
    <div
      className={`morph-audio${expanded ? ' morph-audio--expanded' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <button
        className="morph-audio__surface-toggle"
        type="button"
        aria-label={expanded ? 'Collapse the player' : 'Open the player'}
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      />
      <div className="morph-audio__content">
        <div className="morph-audio__heading">
          <img className="morph-audio__artwork" src={artwork} alt="" />
          <div className="morph-audio__metadata">
            <strong>{title}</strong>
            <span>{subtitle}</span>
          </div>
          {expanded ? (
            <button
              className="morph-audio__like"
              type="button"
              aria-label={liked ? 'Remove from liked songs' : 'Add to liked songs'}
              aria-pressed={liked}
              onClick={() => setLiked((value) => !value)}
            >
              <PlayerIcon name="heart" size={27} />
            </button>
          ) : (
            controls('compact')
          )}
        </div>

        <div className="morph-audio__timeline" aria-label="Playback progress">
          <div className="morph-audio__rail">
            <span className="morph-audio__run" style={{ width: `${progress}%` }} />
            <input
              className="morph-audio__seek"
              type="range"
              min={0}
              max={total}
              step={0.1}
              value={elapsed}
              aria-label="Seek playback"
              aria-valuetext={formatTime(elapsed)}
              onChange={(event) => seek(Number(event.currentTarget.value))}
              onPointerDown={() => {
                seekingRef.current = true
              }}
              onPointerUp={() => {
                seekingRef.current = false
              }}
              onPointerCancel={() => {
                seekingRef.current = false
              }}
              onLostPointerCapture={() => {
                seekingRef.current = false
              }}
            />
          </div>
          {expanded && (
            <div className="morph-audio__time">
              <span>{formatTime(elapsed)}</span>
              <span>−{formatTime(total - elapsed)}</span>
            </div>
          )}
        </div>
        {expanded && controls('expanded')}
      </div>
    </div>
  )
}
