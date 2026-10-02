import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, ReactNode, RefObject } from 'react'
import type { VideoChapter, VideoSubtitle } from '../VideoPlayer'
import { formatMediaTime } from '../media/playback'
import { VideoIcon } from './icons'

type View = 'main' | 'speed' | 'subtitles' | 'captions' | 'chapters' | 'shortcuts'

const shortcuts: [string, string][] = [
  ['Space / K', 'Play or pause'],
  ['← / →', 'Seek 5 seconds'],
  ['J / L', 'Seek 10 seconds'],
  ['↑ / ↓', 'Volume'],
  ['M', 'Mute'],
  ['C', 'Subtitles'],
  ['F', 'Fullscreen'],
  ['I', 'Picture-in-picture'],
  ['< / >', 'Speed'],
  [', / .', 'Frame step while paused'],
  ['0 – 9', 'Jump to 0–90%'],
  ['Home / End', 'Start / end'],
]

export interface PlayerSettingsProps {
  trigger: RefObject<HTMLButtonElement | null>
  onClose: (restoreFocus: boolean) => void
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
  currentChapter?: VideoChapter
  onChapter: (time: number) => void
}

function rateLabel(rate: number) {
  return rate === 1 ? 'Normal' : `${rate}×`
}

export function PlayerSettings({
  trigger,
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
  currentChapter,
  onChapter,
}: PlayerSettingsProps) {
  const panel = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>('main')
  const [returnTo, setReturnTo] = useState<View | null>(null)
  const closeOutside = useEffectEvent((event: PointerEvent) => {
    const target = event.target as Node
    if (!panel.current?.contains(target) && !trigger.current?.contains(target)) onClose(false)
  })

  useEffect(() => {
    const listener = (event: PointerEvent) => closeOutside(event)
    document.addEventListener('pointerdown', listener, true)
    return () => document.removeEventListener('pointerdown', listener, true)
  }, [])

  useEffect(() => {
    const root = panel.current
    if (!root) return
    const target =
      (returnTo && root.querySelector<HTMLElement>(`[data-view="${returnTo}"]`)) ||
      root.querySelector<HTMLElement>('[aria-pressed="true"]') ||
      root.querySelector<HTMLElement>('button, input')
    target?.focus({ preventScroll: true })
  }, [view, returnTo])

  function open(next: View) {
    setReturnTo(null)
    setView(next)
  }

  function back() {
    setReturnTo(view)
    setView('main')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.preventDefault()
      if (view === 'main') onClose(true)
      else back()
      return
    }
    if (
      event.key === 'ArrowLeft' &&
      view !== 'main' &&
      !(event.target instanceof HTMLInputElement)
    ) {
      event.preventDefault()
      back()
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    if (event.target instanceof HTMLInputElement) return
    const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('button, input') ?? [])
    const index = items.indexOf(document.activeElement as HTMLElement)
    const next = items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]
    next?.focus()
    event.preventDefault()
  }

  const subtitleLabel = subtitles.find((track) => track.src === caption)?.label ?? 'Off'
  let content: ReactNode

  if (view === 'main') {
    content = (
      <div className="video-player__menu-list">
        <MenuLink view="speed" label="Speed" value={rateLabel(rate)} onOpen={open} />
        {subtitles.length > 0 && (
          <>
            <MenuLink view="subtitles" label="Subtitles" value={subtitleLabel} onOpen={open} />
            <MenuLink view="captions" label="Caption style" onOpen={open} />
          </>
        )}
        {chapters.length > 0 && (
          <MenuLink view="chapters" label="Chapters" value={currentChapter?.title} onOpen={open} />
        )}
        <MenuSwitch
          label="Fill frame"
          checked={fit === 'cover'}
          onChange={(checked) => onFit(checked ? 'cover' : 'contain')}
        />
        <MenuSwitch label="Loop" checked={loop} onChange={onLoop} />
        <label className="video-player__menu-item video-player__menu-volume">
          <span>Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            style={{ '--fill': `${volume * 100}%` } as CSSProperties}
            onChange={(event) => onVolume(Number(event.target.value))}
          />
        </label>
        <MenuLink view="shortcuts" label="Keyboard shortcuts" onOpen={open} />
      </div>
    )
  } else if (view === 'speed') {
    content = (
      <div className="video-player__menu-list">
        {rates.map((value) => (
          <MenuOption key={value} selected={rate === value} onSelect={() => onRate(value)}>
            {rateLabel(value)}
          </MenuOption>
        ))}
      </div>
    )
  } else if (view === 'subtitles') {
    content = (
      <div className="video-player__menu-list">
        {[{ src: 'off', label: 'Off' }, ...subtitles].map((track) => (
          <MenuOption
            key={track.src}
            selected={caption === track.src}
            onSelect={() => onCaption(track.src)}
          >
            {track.label}
          </MenuOption>
        ))}
      </div>
    )
  } else if (view === 'captions') {
    content = (
      <div className="video-player__menu-list">
        <p
          className="video-player__caption-sample"
          style={
            {
              '--caption-scale': captionSize,
              '--caption-background': captionBackground,
            } as CSSProperties
          }
        >
          <span>Subtitles look like this</span>
        </p>
        <MenuRange
          label="Text size"
          min={0.8}
          max={1.6}
          step={0.1}
          value={captionSize}
          display={`${Math.round(captionSize * 100)}%`}
          onChange={onCaptionSize}
        />
        <MenuRange
          label="Background"
          min={0}
          max={1}
          step={0.1}
          value={captionBackground}
          display={`${Math.round(captionBackground * 100)}%`}
          onChange={onCaptionBackground}
        />
      </div>
    )
  } else if (view === 'chapters') {
    content = (
      <div className="video-player__menu-list">
        {chapters.map((chapter) => (
          <MenuOption
            key={chapter.time}
            selected={chapter === currentChapter}
            onSelect={() => {
              onChapter(chapter.time)
              onClose(true)
            }}
          >
            <span className="video-player__menu-label">{chapter.title}</span>
            <span className="video-player__menu-value">{formatMediaTime(chapter.time)}</span>
          </MenuOption>
        ))}
      </div>
    )
  } else {
    content = (
      <div className="video-player__menu-list">
        <dl className="video-player__shortcuts">
          {shortcuts.map(([keys, action]) => (
            <div key={keys}>
              <dt>{keys}</dt>
              <dd>{action}</dd>
            </div>
          ))}
        </dl>
        <p className="video-player__menu-note">Focus the video area to use shortcuts.</p>
      </div>
    )
  }

  const titles: Record<View, string> = {
    main: 'Settings',
    speed: 'Speed',
    subtitles: 'Subtitles',
    captions: 'Caption style',
    chapters: 'Chapters',
    shortcuts: 'Keyboard shortcuts',
  }

  return (
    <div
      ref={panel}
      className="video-player__menu"
      role="dialog"
      aria-label={`Player settings: ${titles[view]}`}
      data-view={view}
      onKeyDown={handleKeyDown}
    >
      {view !== 'main' && (
        <button type="button" className="video-player__menu-back" onClick={back}>
          <VideoIcon name="chevron-left" size={18} />
          {titles[view]}
        </button>
      )}
      {content}
    </div>
  )
}

function MenuLink({
  view,
  label,
  value,
  onOpen,
}: {
  view: View
  label: string
  value?: string
  onOpen: (view: View) => void
}) {
  return (
    <button
      type="button"
      className="video-player__menu-item"
      data-view={view}
      onClick={() => onOpen(view)}
    >
      <span className="video-player__menu-label">{label}</span>
      {value && <span className="video-player__menu-value">{value}</span>}
      <VideoIcon name="chevron-right" size={16} />
    </button>
  )
}

function MenuOption({
  selected,
  onSelect,
  children,
}: {
  selected: boolean
  onSelect: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="video-player__menu-item video-player__menu-option"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="video-player__menu-check">
        {selected && <VideoIcon name="check" size={16} />}
      </span>
      {children}
    </button>
  )
}

function MenuSwitch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="video-player__menu-item"
      onClick={() => onChange(!checked)}
    >
      <span className="video-player__menu-label">{label}</span>
      <span className="video-player__switch" aria-hidden="true" />
    </button>
  )
}

function MenuRange({
  label,
  display,
  onChange,
  ...input
}: {
  label: string
  display: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}) {
  const fill = ((input.value - input.min) / (input.max - input.min)) * 100
  return (
    <label className="video-player__menu-item video-player__menu-range">
      <span className="video-player__menu-label">{label}</span>
      <input
        type="range"
        {...input}
        aria-valuetext={display}
        style={{ '--fill': `${fill}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output className="video-player__menu-value">{display}</output>
    </label>
  )
}
