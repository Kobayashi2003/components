import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { PlayerIcon } from './components/icons'
import { AudioArtwork } from './components/AudioArtwork'
import './styles.css'
import { formatMediaTime as formatTime, mediaError } from './media/playback'
import { useDeferredSeek } from './media/useDeferredSeek'
import { useMediaCoordinator } from './media/useMediaCoordinator'

export interface AudioPlayerHandle {
  play: () => Promise<void>
  pause: () => void
  seek: (seconds: number) => void
}

export interface AudioPlayerProps {
  ref?: Ref<AudioPlayerHandle>
  src?: string
  title: string
  subtitle: string
  artwork?: string
  artworkLoading?: boolean
  duration?: number
  initialTime?: number
  expandedContent?: ReactNode
  initialExpanded?: boolean
  autoPlay?: boolean
  volume?: number
  muted?: boolean
  playbackRate?: number
  playbackGroup?: string
  mediaSession?: boolean
  liked?: boolean
  onLikedChange?: (liked: boolean) => void
  onTimeChange?: (time: number, duration: number) => void
  onError?: (error: Error) => void
  onVolumeChange?: (volume: number, muted: boolean) => void
  onPrevious?: () => void
  onNext?: () => void
  onEnded?: () => void
  onPlayingChange?: (playing: boolean) => void
  onExpandedChange?: (expanded: boolean) => void
  className?: string
  style?: CSSProperties
}

export function AudioPlayer(props: AudioPlayerProps) {
  return <AudioPlayerSession key={props.src} {...props} />
}

function AudioPlayerSession({
  ref,
  src,
  title,
  subtitle,
  artwork,
  artworkLoading = false,
  duration = 214,
  initialTime = src ? 0 : 52,
  initialExpanded = false,
  expandedContent,
  autoPlay = false,
  volume = 1,
  muted = false,
  playbackRate = 1,
  playbackGroup,
  mediaSession = false,
  liked: controlledLiked,
  onLikedChange,
  onTimeChange,
  onError,
  onVolumeChange,
  onPrevious,
  onNext,
  onEnded,
  onPlayingChange,
  onExpandedChange,
  className = '',
  style,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [mediaDuration, setMediaDuration] = useState(0)
  const [error, setError] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [showWaiting, setShowWaiting] = useState(false)
  const [level, setLevel] = useState(volume)
  const [silent, setSilent] = useState(muted)
  const total = src ? mediaDuration : Math.max(1, Number.isFinite(duration) ? duration : 214)
  const start = Number.isFinite(initialTime) ? Math.max(0, initialTime) : 0
  const [expanded, setExpanded] = useState(initialExpanded)
  const [playing, setPlaying] = useState(false)
  const [localLiked, setLiked] = useState(false)
  const liked = controlledLiked ?? localLiked
  const [elapsed, setElapsed] = useState(() => Math.min(total, start))
  const elapsedRef = useRef(elapsed)
  const playRequest = useRef(0)
  const drag = useDeferredSeek(
    audioRef,
    (value) => {
      elapsedRef.current = value
      setElapsed(value)
    },
    seek,
  )
  const scrubbing = drag.active
  const seeking = drag.dragging
  useMediaCoordinator(audioRef, {
    group: playbackGroup,
    enabled: mediaSession,
    title,
    artist: subtitle,
    artwork,
    onPrevious,
    onNext,
  })

  useEffect(() => {
    if (!audioRef.current) return
    try {
      audioRef.current.playbackRate =
        Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1
    } catch {
      /* Unsupported rates preserve native playback. */
    }
  }, [playbackRate])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 1))
      audio.muted = muted
    }
  }, [volume, muted])

  useEffect(() => {
    if (!waiting) return
    const timer = setTimeout(() => setShowWaiting(true), 250)
    return () => clearTimeout(timer)
  }, [waiting])

  function finishWaiting() {
    setWaiting(false)
    setShowWaiting(false)
  }

  useEffect(() => {
    if (!playing || src) return
    let previousTick = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      if (scrubbing.current) {
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
  }, [playing, total, src, scrubbing])

  function restart() {
    if (audioRef.current) audioRef.current.currentTime = 0
    elapsedRef.current = 0
    setElapsed(0)
  }

  function seek(value: number) {
    const next = Math.min(total, Math.max(0, Number.isFinite(value) ? value : 0))
    if (audioRef.current && total > 0) audioRef.current.currentTime = next
    elapsedRef.current = next
    setElapsed(next)
    if (next >= total) setPlaying(false)
  }

  async function play() {
    const audio = audioRef.current
    if (audio) {
      setError('')
      const request = ++playRequest.current
      try {
        await audio.play()
      } catch (cause) {
        if (
          audioRef.current === audio &&
          request === playRequest.current &&
          !(cause instanceof Error && cause.name === 'AbortError')
        ) {
          const failure = cause instanceof Error ? cause : new Error('Unable to play audio.')
          setError(
            failure.name === 'NotAllowedError'
              ? 'Press Play to start audio.'
              : mediaError(audio.error),
          )
          onError?.(failure)
        }
        throw cause
      }
      return
    }
    if (!playing && elapsedRef.current >= total) restart()
    setPlaying(true)
  }

  function pause() {
    playRequest.current += 1
    if (audioRef.current) audioRef.current.pause()
    else setPlaying(false)
  }

  function togglePlay() {
    if (audioRef.current ? !audioRef.current.paused : playing) pause()
    else void play().catch(() => {})
  }

  useImperativeHandle(ref, () => ({ play, pause, seek }))

  const progress = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0

  const controls = (size: 'compact' | 'expanded') => (
    <div className={`morph-audio__transport morph-audio__transport--${size}`}>
      <button
        type="button"
        aria-label={onPrevious ? 'Previous track' : 'Restart'}
        onClick={onPrevious ?? restart}
      >
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
      <button type="button" aria-label="Next track" onClick={onNext} disabled={!onNext}>
        <PlayerIcon name="next" size={size === 'compact' ? 22 : 28} />
      </button>
    </div>
  )

  return (
    <div
      className={`morph-audio${expanded ? ' morph-audio--expanded' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      data-state={
        error
          ? 'error'
          : seeking
            ? 'seeking'
            : waiting && showWaiting
              ? 'buffering'
              : playing
                ? 'playing'
                : src && !mediaDuration
                  ? 'loading'
                  : 'paused'
      }
    >
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          autoPlay={autoPlay}
          onLoadedMetadata={(event) => {
            const audio = event.currentTarget
            const length = Number.isFinite(audio.duration) ? audio.duration : 0
            setMediaDuration(length)
            audio.currentTime = Math.min(length, start)
            try {
              audio.playbackRate =
                Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1
            } catch {
              /* Preserve supported playback. */
            }
          }}
          onDurationChange={(event) =>
            setMediaDuration(
              Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0,
            )
          }
          onTimeUpdate={(event) => {
            if (scrubbing.current) return
            elapsedRef.current = event.currentTarget.currentTime
            setElapsed(event.currentTarget.currentTime)
            onTimeChange?.(event.currentTarget.currentTime, mediaDuration)
          }}
          onPlay={() => {
            setPlaying(true)
            onPlayingChange?.(true)
          }}
          onPlaying={finishWaiting}
          onWaiting={() => setWaiting(true)}
          onCanPlay={finishWaiting}
          onPause={() => {
            setPlaying(false)
            finishWaiting()
            onPlayingChange?.(false)
          }}
          onEnded={() => {
            setPlaying(false)
            finishWaiting()
            onEnded?.()
          }}
          onVolumeChange={(event) => {
            const audio = event.currentTarget
            setLevel(audio.volume)
            setSilent(audio.muted)
            onVolumeChange?.(audio.volume, audio.muted)
          }}
          onError={() => {
            setPlaying(false)
            onPlayingChange?.(false)
            finishWaiting()
            const message = mediaError(audioRef.current?.error ?? null)
            setError(message)
            onError?.(new Error(message))
          }}
        />
      )}
      <button
        className="morph-audio__surface-toggle"
        type="button"
        aria-label={expanded ? 'Collapse the player' : 'Open the player'}
        aria-expanded={expanded}
        onClick={() => {
          setExpanded(!expanded)
          onExpandedChange?.(!expanded)
        }}
      />
      <div className="morph-audio__content">
        <div className="morph-audio__heading">
          <AudioArtwork key={artwork} src={artwork} reading={artworkLoading} />
          <div className="morph-audio__metadata">
            <strong title={title}>{title}</strong>
            <span title={subtitle}>{subtitle}</span>
          </div>
          {expanded ? (
            <button
              className="morph-audio__like"
              type="button"
              aria-label={liked ? 'Remove from liked songs' : 'Add to liked songs'}
              aria-pressed={liked}
              onClick={() => {
                setLiked(!liked)
                onLikedChange?.(!liked)
              }}
            >
              <PlayerIcon name="heart" size={27} />
            </button>
          ) : (
            controls('compact')
          )}
        </div>

        <div className="morph-audio__timeline" aria-label="Playback progress">
          <div className={`morph-audio__rail${seeking ? ' morph-audio__rail--seeking' : ''}`}>
            <span className="morph-audio__run" style={{ width: `${progress}%` }} />
            <input
              className="morph-audio__seek"
              type="range"
              min={0}
              max={total || 1}
              disabled={!!src && !total}
              step={0.1}
              value={elapsed}
              aria-label="Seek playback"
              aria-valuetext={formatTime(elapsed)}
              onChange={(event) => drag.update(Number(event.currentTarget.value))}
              onPointerDown={(event) => {
                drag.begin(elapsed)
                event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerUp={() => drag.finish()}
              onPointerCancel={() => drag.finish(true)}
              onLostPointerCapture={() => drag.finish(true)}
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
        {expanded && src && (
          <div className="morph-audio__volume">
            <button
              type="button"
              aria-label="Mute"
              aria-pressed={silent || level === 0}
              onClick={() => {
                const audio = audioRef.current
                if (!audio) return
                if (audio.volume === 0) {
                  audio.volume = 0.5
                  audio.muted = false
                } else audio.muted = !audio.muted
              }}
            >
              <PlayerIcon name={silent || level === 0 ? 'muted' : 'volume'} size={18} />
            </button>
            <input
              type="range"
              aria-label="Volume"
              min={0}
              max={1}
              step={0.01}
              value={silent ? 0 : level}
              onChange={(event) => {
                const audio = audioRef.current
                if (audio) {
                  audio.volume = Number(event.currentTarget.value)
                  audio.muted = false
                }
              }}
            />
          </div>
        )}
        {expanded && expandedContent && (
          <div className="morph-audio__expanded-content">{expandedContent}</div>
        )}
        {showWaiting && waiting && (
          <span className="morph-audio__loading" role="status">
            Buffering…
          </span>
        )}
        {error && (
          <p role="alert" className="morph-audio__error">
            {error}{' '}
            <button
              type="button"
              onClick={() => {
                audioRef.current?.load()
                togglePlay()
              }}
            >
              Retry
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
