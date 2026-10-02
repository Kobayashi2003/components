import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { VideoSubtitle, VideoChapter } from '../VideoPlayer'
import { formatMediaTime } from '../media/playback'

export function PlayerSettings({
  root,
  onClose,
  rates,
  rate,
  onRate,
  subtitles,
  caption,
  onCaption,
  captionSize,
  onCaptionSize,
  captionBackground,
  onCaptionBackground,
  fit,
  onFit,
  volume,
  onVolume,
  loop,
  onLoop,
  chapters,
  onChapter,
}: {
  root: RefObject<HTMLDivElement | null>
  onClose: () => void
  rates: number[]
  rate: number
  onRate: (value: number) => void
  subtitles: readonly VideoSubtitle[]
  caption: string
  onCaption: (value: string) => void
  captionSize: number
  onCaptionSize: (value: number) => void
  captionBackground: number
  onCaptionBackground: (value: number) => void
  fit: 'contain' | 'cover'
  onFit: (value: 'contain' | 'cover') => void
  volume: number
  onVolume: (value: number) => void
  loop: boolean
  onLoop: (value: boolean) => void
  chapters: readonly VideoChapter[]
  onChapter: (time: number) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  function close() {
    dialog.current?.close()
    onClose()
  }
  useEffect(() => {
    const panel = dialog.current
    const player = root.current
    if (!panel || !player) return
    const place = () => {
      const bounds = player.getBoundingClientRect()
      const width = Math.min(336, bounds.width - 24, window.innerWidth - 24)
      panel.style.width = `${width}px`
      panel.style.left = `${Math.max(12, Math.min(window.innerWidth - width - 12, bounds.right - width - 12))}px`
      panel.style.top = `${Math.max(12, bounds.top + 12)}px`
      panel.style.maxHeight = `${Math.max(120, Math.min(bounds.height - 24, window.innerHeight - Math.max(12, bounds.top + 12) - 12))}px`
    }
    place()
    panel.showModal()
    const observer = new ResizeObserver(place)
    observer.observe(player)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      panel.close()
    }
  }, [root])
  return (
    <dialog
      ref={dialog}
      className="video-player__settings"
      aria-label="Player settings"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            close()
        }
      }}
    >
      <header>
        <strong>Playback settings</strong>
        <button type="button" autoFocus aria-label="Close settings" onClick={close}>
          ×
        </button>
      </header>
      <div className="video-player__settings-body">
        <fieldset>
          <legend>Speed</legend>
          <div className="video-player__choices">
            {rates.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={rate === value}
                onClick={() => onRate(value)}
              >
                {value}×
              </button>
            ))}
          </div>
        </fieldset>
        <label className="video-player__setting-row">
          Volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => onVolume(Number(event.target.value))}
          />
        </label>
        <label className="video-player__setting-row">
          Loop video
          <input
            type="checkbox"
            checked={loop}
            onChange={(event) => onLoop(event.target.checked)}
          />
        </label>
        <fieldset>
          <legend>Picture</legend>
          <div className="video-player__choices">
            <button type="button" aria-pressed={fit === 'contain'} onClick={() => onFit('contain')}>
              Fit
            </button>
            <button type="button" aria-pressed={fit === 'cover'} onClick={() => onFit('cover')}>
              Fill
            </button>
          </div>
        </fieldset>
        {subtitles.length > 0 && (
          <>
            <fieldset>
              <legend>Subtitles</legend>
              {[{ src: 'off', label: 'Off' }, ...subtitles].map((track) => (
                <label className="video-player__setting-row" key={track.src} title={track.label}>
                  <span>{track.label}</span>
                  <input
                    type="radio"
                    name="video-subtitles"
                    checked={caption === track.src}
                    onChange={() => onCaption(track.src)}
                  />
                </label>
              ))}
            </fieldset>
            <label className="video-player__setting-row">
              Text size
              <input
                aria-label="Subtitle text size"
                type="range"
                min={0.8}
                max={1.6}
                step={0.1}
                value={captionSize}
                onChange={(event) => onCaptionSize(Number(event.target.value))}
              />
            </label>
            <label className="video-player__setting-row">
              Background
              <input
                aria-label="Subtitle background"
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={captionBackground}
                onChange={(event) => onCaptionBackground(Number(event.target.value))}
              />
            </label>
          </>
        )}
        {chapters.length > 0 && (
          <fieldset>
            <legend>Chapters</legend>
            {chapters.map((chapter) => (
              <button
                className="video-player__chapter-link"
                type="button"
                key={chapter.time}
                onClick={() => {
                  onChapter(chapter.time)
                  close()
                }}
              >
                <span>{chapter.title}</span>
                <span>{formatMediaTime(chapter.time)}</span>
              </button>
            ))}
          </fieldset>
        )}
        <details>
          <summary>Keyboard shortcuts</summary>
          <dl>
            <dt>Space / K</dt>
            <dd>Play or pause</dd>
            <dt>← / →</dt>
            <dd>Seek 5 seconds</dd>
            <dt>↑ / ↓</dt>
            <dd>Volume</dd>
            <dt>M</dt>
            <dd>Mute</dd>
            <dt>F</dt>
            <dd>Fullscreen</dd>
            <dt>Home / End</dt>
            <dd>Start / end</dd>
          </dl>
          <p>Focus the video area to use shortcuts. Sliders retain their native keys.</p>
        </details>
      </div>
    </dialog>
  )
}
