import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, Ref } from 'react'
import { VideoIcon } from './components/icons'
import { PlayerSettings } from './components/PlayerSettings'
import { useDeferredSeek } from './media/useDeferredSeek'
import { useMediaCoordinator } from './media/useMediaCoordinator'
import { formatMediaTime as formatTime, mediaError } from './media/playback'

export interface VideoSubtitle {
  src: string
  label: string
  language: string
}

export interface VideoChapter {
  time: number
  title: string
}
export interface VideoThumbnail {
  start: number
  end: number
  src: string
}

const emptySubtitles: readonly VideoSubtitle[] = []

export interface VideoPlayerHandle {
  play: () => Promise<void>
  pause: () => void
  seek: (time: number) => void
}

export interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  initialTime?: number
  defaultVolume?: number
  playbackRates?: readonly number[]
  subtitles?: readonly VideoSubtitle[]
  resumeTime?: number
  chapters?: readonly VideoChapter[]
  thumbnails?: readonly VideoThumbnail[]
  playbackRate?: number
  playbackGroup?: string
  mediaSession?: boolean
  defaultSubtitle?: string
  touchGestures?: boolean
  doubleClickFullscreen?: boolean
  onVolumeChange?: (volume: number, muted: boolean) => void
  onRateChange?: (rate: number) => void
  onSubtitleChange?: (language: string | null) => void
  className?: string
  style?: CSSProperties
  ref?: Ref<VideoPlayerHandle>
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeChange?: (time: number, duration: number) => void
  onError?: (error: Error) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}

export function VideoPlayer(props: VideoPlayerProps) {
  return <VideoPlayerSession key={props.src} {...props} />
}

function VideoPlayerSession({
  src,
  poster,
  title = 'Video Player',
  autoPlay = false,
  muted = false,
  loop = false,
  preload = 'metadata',
  initialTime = 0,
  defaultVolume = 1,
  playbackRates = [0.5, 1, 1.25, 1.5, 2],
  subtitles = emptySubtitles,
  resumeTime = 0,
  chapters = [],
  thumbnails = [],
  playbackRate = 1,
  playbackGroup,
  mediaSession = false,
  defaultSubtitle,
  touchGestures = true,
  doubleClickFullscreen = true,
  onVolumeChange,
  onRateChange,
  onSubtitleChange,
  className = '',
  style,
  ref,
  onPlay,
  onPause,
  onEnded,
  onTimeChange,
  onError,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const playRequest = useRef(0)
  const revealOnly = useRef(false)
  const keyboardMode = useRef(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [playing, setPlaying] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [ended, setEnded] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState<[number, number][]>([])
  const [volume, setVolume] = useState(clamp(defaultVolume, 0, 1))
  const [isMuted, setIsMuted] = useState(muted)
  const [rate, setRate] = useState(1)
  const [visible, setVisible] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [preview, setPreview] = useState<number | null>(null)
  const [waitingVisible, setWaitingVisible] = useState(false)
  const [caption, setCaption] = useState(defaultSubtitle ?? 'off')
  const [captionLines, setCaptionLines] = useState<{ src: string; lines: string[] }>({
    src: 'off',
    lines: [],
  })
  const [resumeDismissed, setResumeDismissed] = useState(false)
  const [pip, setPip] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [remainingTime, setRemainingTime] = useState(false)
  const [captionSize, setCaptionSize] = useState(1)
  const [captionBackground, setCaptionBackground] = useState(0.7)
  const [fit, setFit] = useState<'contain' | 'cover'>('contain')
  const [repeatOverride, setRepeat] = useState<boolean | undefined>(undefined)
  const repeat = repeatOverride ?? loop
  const settingsButton = useRef<HTMLButtonElement>(null)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pointerOrigin = useRef({ x: 0, y: 0, touch: false })
  const lastTap = useRef({ at: 0, side: 0 })
  const clickPlayback = useRef({ wasPaused: true, committed: false })
  const drag = useDeferredSeek(
    videoRef,
    (value) => {
      setTime(value)
      setPreview(value)
    },
    seek,
  )
  const scrubbing = drag.active
  const isScrubbing = drag.dragging
  const controlsVisible = visible || !playing || !!error || settingsOpen || isScrubbing
  const activeCaption =
    subtitles.find((track) => track.src === caption || track.language === caption)?.src ?? 'off'
  const validChapters = chapters
    .filter(
      (chapter) => Number.isFinite(chapter.time) && chapter.time >= 0 && chapter.time < duration,
    )
    .filter(
      (chapter, index, values) => values.findIndex((item) => item.time === chapter.time) === index,
    )
    .sort((a, b) => a.time - b.time)
  const hoveredChapter = [...validChapters]
    .reverse()
    .find((chapter) => chapter.time <= (preview ?? time))
  const thumbnail =
    preview === null
      ? undefined
      : thumbnails.find((item) => preview >= item.start && preview < item.end)
  useMediaCoordinator(videoRef, {
    group: playbackGroup,
    enabled: mediaSession,
    title,
    artwork: poster,
  })
  useEffect(() => () => clearTimeout(clickTimer.current), [])
  useEffect(() => {
    if (videoRef.current) {
      try {
        videoRef.current.playbackRate = playbackRate
      } catch {
        /* Preserve the supported native rate. */
      }
    }
  }, [playbackRate])
  const showResume = !resumeDismissed && !playing && resumeTime > 3 && duration > resumeTime + 3

  useEffect(() => {
    if (!waiting) return
    const timer = setTimeout(() => setWaitingVisible(true), 250)
    return () => clearTimeout(timer)
  }, [waiting])

  function finishWaiting() {
    setWaiting(false)
    setWaitingVisible(false)
  }

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new ResizeObserver(() =>
      root.style.setProperty('--video-player-height', `${root.clientHeight}px`),
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const enter = () => setPip(true)
    const leave = () => setPip(false)
    video.addEventListener('enterpictureinpicture', enter)
    video.addEventListener('leavepictureinpicture', leave)
    return () => {
      video.removeEventListener('enterpictureinpicture', enter)
      video.removeEventListener('leavepictureinpicture', leave)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const tracks = Array.from(video.querySelectorAll('track'))
    const update = () => {
      tracks.forEach((element) => {
        element.track.mode =
          element.getAttribute('src') === activeCaption ? (pip ? 'showing' : 'hidden') : 'disabled'
      })
    }
    const updateCues = () => {
      const selected = tracks.find((element) => element.getAttribute('src') === activeCaption)
      const lines = Array.from(selected?.track.activeCues ?? []).flatMap((cue) =>
        cue instanceof VTTCue ? [cue.getCueAsHTML().textContent ?? ''] : [],
      )
      setCaptionLines((current) =>
        current.src === activeCaption &&
        current.lines.length === lines.length &&
        current.lines.every((line, index) => line === lines[index])
          ? current
          : { src: activeCaption, lines },
      )
    }
    update()
    tracks.forEach((element) => element.track.addEventListener('cuechange', updateCues))
    video.addEventListener('timeupdate', updateCues)
    video.addEventListener('load', updateCues, true)
    return () => {
      tracks.forEach((element) => element.track.removeEventListener('cuechange', updateCues))
      video.removeEventListener('timeupdate', updateCues)
      video.removeEventListener('load', updateCues, true)
    }
  }, [activeCaption, subtitles, pip])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 2800)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    const video = videoRef.current
    if (video) video.volume = clamp(defaultVolume, 0, 1)
  }, [defaultVolume, src])

  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === rootRef.current)
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  function reveal() {
    clearTimeout(hideTimer.current)
    setVisible(true)
    if (!videoRef.current?.paused) {
      hideTimer.current = setTimeout(() => {
        if (
          !scrubbing.current &&
          !(keyboardMode.current && rootRef.current?.contains(document.activeElement)) &&
          !rootRef.current?.querySelector('[aria-expanded="true"]') &&
          !controlsRef.current?.matches(':hover')
        )
          setVisible(false)
      }, 2500)
    }
  }

  function reportError(cause: unknown) {
    const failure = cause instanceof Error ? cause : new Error('Video loading failed')
    if (failure.name === 'NotAllowedError') {
      setNotice('Press Play to start this video.')
      finishWaiting()
      setVisible(true)
      onError?.(failure)
      return
    }
    setError(mediaError(videoRef.current?.error ?? null))
    finishWaiting()
    setVisible(true)
    onError?.(failure)
  }

  async function play() {
    const video = videoRef.current
    if (!video) return
    const request = ++playRequest.current
    setError('')
    try {
      await video.play()
    } catch (cause) {
      if (
        videoRef.current === video &&
        request === playRequest.current &&
        !(cause instanceof Error && cause.name === 'AbortError')
      )
        reportError(cause)
      throw cause
    }
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    setNotice(video.paused ? 'Playing' : 'Paused')
    if (video.paused) void play().catch(() => {})
    else pause()
  }

  function pause() {
    playRequest.current += 1
    videoRef.current?.pause()
  }

  function seek(nextTime: number) {
    const video = videoRef.current
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = clamp(nextTime, 0, video.duration)
      setTime(video.currentTime)
      onTimeChange?.(video.currentTime, video.duration)
    }
  }

  useImperativeHandle(ref, () => ({ play, pause, seek }))

  async function toggleFullscreen() {
    setNotice('')
    try {
      if (document.fullscreenElement === rootRef.current) await document.exitFullscreen()
      else await rootRef.current?.requestFullscreen()
    } catch {
      setNotice('Unable to switch fullscreen. Check your browser permissions.')
      reveal()
    }
  }

  async function togglePip() {
    const video = videoRef.current
    if (!video) return
    try {
      if (document.pictureInPictureElement === video) await document.exitPictureInPicture()
      else await video.requestPictureInPicture()
    } catch {
      setNotice('Picture-in-picture is unavailable for this video.')
    }
  }

  function changeVolume(nextVolume: number) {
    const video = videoRef.current
    if (!video) return
    video.volume = clamp(nextVolume, 0, 1)
    video.muted = false
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    if (video.volume === 0) {
      video.volume = 0.5
      video.muted = false
    } else video.muted = !video.muted
    setNotice(video.muted ? 'Muted' : `${Math.round(video.volume * 100)}% volume`)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Tab') reveal()
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.repeat && [' ', 'k', 'm', 'f'].includes(event.key.toLowerCase())) return
    if (
      event.target instanceof HTMLElement &&
      event.target !== event.currentTarget &&
      event.target !== videoRef.current
    )
      return
    const video = videoRef.current
    if (!video) return
    switch (event.key.toLowerCase()) {
      case ' ':
      case 'k':
        togglePlay()
        break
      case 'arrowleft':
        seek(video.currentTime - 5)
        setNotice('−5 seconds')
        break
      case 'arrowright':
        seek(video.currentTime + 5)
        setNotice('+5 seconds')
        break
      case 'arrowup':
        changeVolume(video.volume + 0.1)
        setNotice(`${Math.round(video.volume * 100)}% volume`)
        break
      case 'arrowdown':
        changeVolume(video.volume - 0.1)
        setNotice(`${Math.round(video.volume * 100)}% volume`)
        break
      case 'm':
        toggleMute()
        break
      case 'f':
        void toggleFullscreen()
        break
      case 'home':
        seek(0)
        break
      case 'end':
        seek(video.duration)
        break
      default:
        return
    }
    event.preventDefault()
    reveal()
  }

  const rates = [
    ...new Set([1, rate, ...playbackRates.filter((value) => Number.isFinite(value) && value > 0)]),
  ].sort((a, b) => a - b)

  return (
    <div
      ref={rootRef}
      className={`video-player ${className}`}
      style={style}
      role="region"
      aria-label={title}
      tabIndex={0}
      onKeyDownCapture={() => {
        keyboardMode.current = true
        reveal()
      }}
      onKeyDown={handleKeyDown}
      onPointerMove={reveal}
      onPointerDown={() => {
        keyboardMode.current = false
        reveal()
      }}
      onPointerLeave={reveal}
      onFocus={reveal}
      onBlur={reveal}
      data-controls-visible={controlsVisible}
      data-state={
        error
          ? 'error'
          : isScrubbing
            ? 'seeking'
            : waiting && waitingVisible
              ? 'buffering'
              : ended
                ? 'ended'
                : playing
                  ? 'playing'
                  : duration
                    ? 'paused'
                    : 'loading'
      }
      data-settings-open={settingsOpen}
    >
      <video
        key={src}
        ref={videoRef}
        className="video-player__media"
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={repeat}
        preload={preload}
        playsInline
        onPointerDown={(event) => {
          pointerOrigin.current = {
            x: event.clientX,
            y: event.clientY,
            touch: event.pointerType === 'touch',
          }
          revealOnly.current = !controlsVisible
        }}
        onPointerUp={(event) => {
          if (!pointerOrigin.current.touch || !touchGestures) return
          if (
            Math.hypot(
              event.clientX - pointerOrigin.current.x,
              event.clientY - pointerOrigin.current.y,
            ) > 12
          )
            return
          if (revealOnly.current) {
            reveal()
            lastTap.current.at = 0
            return
          }
          const bounds = event.currentTarget.getBoundingClientRect()
          const fraction = (event.clientX - bounds.left) / bounds.width
          const side = fraction < 0.35 ? -1 : fraction > 0.65 ? 1 : 0
          const now = Date.now()
          if (side !== 0 && now - lastTap.current.at < 320 && lastTap.current.side === side) {
            clearTimeout(clickTimer.current)
            seek((videoRef.current?.currentTime ?? 0) + side * 10)
            setNotice(side < 0 ? '−10 seconds' : '+10 seconds')
            lastTap.current.at = 0
          } else {
            clearTimeout(clickTimer.current)
            lastTap.current = { at: now, side }
            clickTimer.current = setTimeout(togglePlay, 320)
          }
        }}
        onPointerCancel={() => {
          clearTimeout(clickTimer.current)
          lastTap.current.at = 0
        }}
        style={{ objectFit: fit }}
        onClick={(event) => {
          if (pointerOrigin.current.touch && touchGestures) return
          if (event.detail > 1) return
          if (revealOnly.current) reveal()
          else {
            clearTimeout(clickTimer.current)
            clickPlayback.current = {
              wasPaused: videoRef.current?.paused ?? true,
              committed: false,
            }
            if (doubleClickFullscreen)
              clickTimer.current = setTimeout(() => {
                clickPlayback.current.committed = true
                togglePlay()
              }, 320)
            else togglePlay()
          }
          revealOnly.current = false
        }}
        onDoubleClick={() => {
          if (!doubleClickFullscreen || pointerOrigin.current.touch) return
          clearTimeout(clickTimer.current)
          if (clickPlayback.current.committed) {
            if (clickPlayback.current.wasPaused) pause()
            else void play().catch(() => {})
            clickPlayback.current.committed = false
          }
          void toggleFullscreen()
        }}
        onLoadStart={(event) => {
          setTime(event.currentTarget.currentTime)
          setDuration(
            Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0,
          )
          setBuffered([])
          setPlaying(false)
          setEnded(false)
          setError('')
          finishWaiting()
          setRate(event.currentTarget.playbackRate)
          setVolume(event.currentTarget.volume)
          setIsMuted(event.currentTarget.muted)
          setVisible(true)
          clearTimeout(hideTimer.current)
        }}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget
          setDuration(Number.isFinite(video.duration) ? video.duration : 0)
          if (Number.isFinite(video.duration))
            video.currentTime = clamp(initialTime, 0, video.duration)
          try {
            video.playbackRate =
              Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1
          } catch {
            /* Preserve supported playback. */
          }
        }}
        onDurationChange={(event) =>
          setDuration(
            Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0,
          )
        }
        onPlay={(event) => {
          setDuration(
            Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0,
          )
          setPlaying(true)
          setResumeDismissed(true)
          setEnded(false)
          onPlay?.()
          reveal()
        }}
        onPlaying={finishWaiting}
        onPause={() => {
          setPlaying(false)
          finishWaiting()
          setVisible(true)
          onPause?.()
        }}
        onWaiting={() => setWaiting(true)}
        onSeeking={() => setWaiting(true)}
        onSeeked={(event) => {
          finishWaiting()
          setEnded(event.currentTarget.ended)
        }}
        onCanPlay={(event) => {
          finishWaiting()
          setDuration(
            Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0,
          )
        }}
        onEnded={() => {
          setEnded(true)
          setPlaying(false)
          finishWaiting()
          onEnded?.()
        }}
        onTimeUpdate={(event) => {
          const video = event.currentTarget
          if (!scrubbing.current) setTime(video.currentTime)
          setDuration(Number.isFinite(video.duration) ? video.duration : 0)
          onTimeChange?.(video.currentTime, Number.isFinite(video.duration) ? video.duration : 0)
        }}
        onProgress={(event) => {
          const ranges = event.currentTarget.buffered
          setBuffered(
            Array.from({ length: ranges.length }, (_, index) => [
              ranges.start(index),
              ranges.end(index),
            ]),
          )
        }}
        onVolumeChange={(event) => {
          setVolume(event.currentTarget.volume)
          setIsMuted(event.currentTarget.muted)
          onVolumeChange?.(event.currentTarget.volume, event.currentTarget.muted)
        }}
        onRateChange={(event) => {
          setRate(event.currentTarget.playbackRate)
          onRateChange?.(event.currentTarget.playbackRate)
        }}
        onError={() =>
          reportError(new Error(`Video loading failed: ${videoRef.current?.error?.code ?? 0}`))
        }
      >
        {subtitles.map((track) => (
          <track
            key={track.src}
            kind="subtitles"
            src={track.src}
            label={track.label}
            srcLang={track.language}
            onError={() => setNotice('Unable to load subtitles. Use a valid WebVTT file.')}
          />
        ))}
      </video>
      {!pip &&
        activeCaption !== 'off' &&
        captionLines.src === activeCaption &&
        captionLines.lines.length > 0 && (
          <div
            className="video-player__captions"
            aria-hidden="true"
            style={
              {
                '--caption-scale': captionSize,
                '--caption-background': captionBackground,
              } as CSSProperties
            }
          >
            {captionLines.lines.map((line, index) => (
              <span key={index}>{line}</span>
            ))}
          </div>
        )}
      <div className="video-player__heading" inert={!controlsVisible}>
        <span>{title}</span>
        {typeof document !== 'undefined' && document.pictureInPictureEnabled && (
          <button
            type="button"
            className="video-player__pip"
            aria-label={pip ? 'Exit picture-in-picture' : 'Picture-in-picture'}
            title="Picture-in-picture"
            disabled={!duration}
            onClick={() => void togglePip()}
          >
            <VideoIcon name="pip" />
          </button>
        )}
      </div>
      {notice && (
        <div className="video-player__notice" role="status">
          {notice}
        </div>
      )}
      {waiting && waitingVisible && !error && (
        <div className="video-player__status" role="status">
          Buffering…
        </div>
      )}
      {showResume && !error && (
        <div className="video-player__resume">
          <button
            type="button"
            onClick={() => {
              seek(resumeTime)
              setResumeDismissed(true)
              void play().catch(() => {})
            }}
          >
            Resume at {formatTime(resumeTime)}
          </button>
          <button
            type="button"
            aria-label="Dismiss resume"
            onClick={() => setResumeDismissed(true)}
          >
            ×
          </button>
        </div>
      )}
      {error && (
        <div className="video-player__error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              playRequest.current += 1
              videoRef.current?.load()
              void play().catch(() => {})
            }}
          >
            Replay
          </button>
        </div>
      )}
      {!playing && !error && !waiting && !showResume && !isScrubbing && (
        <button
          className="video-player__start"
          type="button"
          onClick={togglePlay}
          aria-label={ended ? 'Replay' : 'Play'}
        >
          <VideoIcon name={ended ? 'replay' : 'play'} size={30} />
        </button>
      )}
      <div ref={controlsRef} className="video-player__controls" inert={!controlsVisible}>
        <div
          className="video-player__timeline"
          data-scrubbing={isScrubbing}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect()
            setPreview(clamp((event.clientX - bounds.left) / bounds.width, 0, 1) * duration)
          }}
          onPointerLeave={() => {
            if (!scrubbing.current) setPreview(null)
          }}
        >
          {preview !== null && duration > 0 && (
            <output
              className="video-player__preview"
              style={{ left: `${clamp((preview / duration) * 100, 8, 92)}%` }}
            >
              {thumbnail && (
                <img
                  key={thumbnail.src}
                  src={thumbnail.src}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.hidden = true
                  }}
                />
              )}
              {hoveredChapter && <span>{hoveredChapter.title}</span>}
              {formatTime(preview)}
            </output>
          )}
          <div className="video-player__track" aria-hidden="true">
            {buffered.map(([start, end], index) => (
              <span
                key={index}
                className="video-player__buffer"
                style={{
                  left: `${duration ? (start / duration) * 100 : 0}%`,
                  width: `${duration ? ((end - start) / duration) * 100 : 0}%`,
                }}
              />
            ))}
            <span
              className="video-player__progress"
              style={{ width: `${duration ? (time / duration) * 100 : 0}%` }}
            />
          </div>
          {validChapters.map((chapter) => (
            <span
              key={chapter.time}
              className="video-player__chapter-marker"
              aria-hidden="true"
              style={{ left: `${(chapter.time / duration) * 100}%` }}
            />
          ))}
          <span
            className="video-player__thumb"
            aria-hidden="true"
            style={{ left: `${duration ? (time / duration) * 100 : 0}%` }}
          />
          <input
            aria-label="Playback progress"
            aria-valuetext={`${formatTime(time)} / ${formatTime(duration)}`}
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={time}
            disabled={!duration}
            onPointerDown={(event) => {
              drag.begin(time)
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerUp={() => {
              drag.finish()
              setPreview(null)
              reveal()
            }}
            onPointerCancel={() => {
              drag.finish(true)
              setPreview(null)
              reveal()
            }}
            onLostPointerCapture={() => {
              drag.finish(true)
              setPreview(null)
            }}
            onChange={(event) => drag.update(Number(event.target.value))}
          />
        </div>
        <div className="video-player__toolbar">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
            title={playing ? 'Pause (Space)' : 'Play (Space)'}
          >
            <VideoIcon name={playing ? 'pause' : 'play'} />
          </button>
          <button
            className="video-player__skip"
            type="button"
            onClick={() => {
              seek(time - 10)
              setNotice('−10 seconds')
            }}
            aria-label="Back 10 seconds"
            title="Back 10 seconds"
          >
            <VideoIcon name="back" />
          </button>
          <button
            type="button"
            className="video-player__time"
            aria-label={remainingTime ? 'Show total duration' : 'Show remaining time'}
            onClick={() => setRemainingTime(!remainingTime)}
          >
            {formatTime(time)}{' '}
            <span>
              {remainingTime ? `−${formatTime(duration - time)}` : `/ ${formatTime(duration)}`}
            </span>
          </button>
          <div className="video-player__spacer" />
          <button
            type="button"
            aria-label="Mute"
            title={isMuted || volume === 0 ? 'Unmute (M)' : 'Mute (M)'}
            aria-pressed={isMuted || volume === 0}
            onClick={toggleMute}
          >
            <VideoIcon name={isMuted || volume === 0 ? 'muted' : 'volume'} />
          </button>
          <input
            className="video-player__volume"
            aria-label="Volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(event) => changeVolume(Number(event.target.value))}
          />
          <button
            ref={settingsButton}
            type="button"
            aria-label="Player settings"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen(true)}
            className="video-player__settings-trigger"
          >
            <span>{rate}×</span>
            <VideoIcon name="settings" />
          </button>
          <button
            type="button"
            disabled={typeof document !== 'undefined' && !document.fullscreenEnabled}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={fullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
            onClick={() => void toggleFullscreen()}
          >
            <VideoIcon name={fullscreen ? 'collapse' : 'expand'} />
          </button>
        </div>
      </div>
      {settingsOpen && (
        <PlayerSettings
          root={rootRef}
          onClose={() => {
            setSettingsOpen(false)
            settingsButton.current?.focus({ preventScroll: true })
            reveal()
          }}
          rates={rates}
          rate={rate}
          onRate={(value) => {
            try {
              if (videoRef.current) videoRef.current.playbackRate = value
            } catch {
              setNotice('This speed is not supported by your browser.')
            }
          }}
          subtitles={subtitles}
          caption={activeCaption}
          onCaption={(value) => {
            setCaption(value)
            onSubtitleChange?.(subtitles.find((track) => track.src === value)?.language ?? null)
          }}
          captionSize={captionSize}
          onCaptionSize={setCaptionSize}
          captionBackground={captionBackground}
          onCaptionBackground={setCaptionBackground}
          fit={fit}
          onFit={setFit}
          volume={isMuted ? 0 : volume}
          onVolume={changeVolume}
          loop={repeat}
          onLoop={setRepeat}
          chapters={validChapters}
          onChapter={seek}
        />
      )}
    </div>
  )
}
