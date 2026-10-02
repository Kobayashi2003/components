import { useEffect, useRef, useState } from 'react'
import { AudioPlayer } from '..'
import type { AudioPlayerHandle } from '..'
import { AudioFilePicker } from './AudioFilePicker'
import { useAudioLibrary } from './useAudioLibrary'
import { QueueNavigation } from './queue'
import type { RepeatMode } from './queue'
import { useMediaPreferences, readPreference, writePreference } from './preferences'
import cover from './cover.jpg'
import './styles.css'

export default function AudioPlayerShowcase() {
  const library = useAudioLibrary()
  const { files } = library
  const player = useRef<AudioPlayerHandle>(null)
  const navigation = useRef(new QueueNavigation())
  const elapsed = useRef(0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [imported, setImported] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [repeat, setRepeat] = useState<RepeatMode>('off')
  const [shuffle, setShuffle] = useState(false)
  const [sleepUntil, setSleepUntil] = useState<number | null>(null)
  const [preferences, setPreferences] = useMediaPreferences('atlas:audio:preferences')
  const [likes, setLikes] = useState<string[]>(() => {
    const stored = readPreference<unknown>('atlas:audio:likes', [])
    return Array.isArray(stored)
      ? stored.filter((value): value is string => typeof value === 'string')
      : []
  })
  const index = Math.max(
    0,
    files.findIndex((file) => file.id === activeId),
  )
  const file = files[index]
  const ids = files.map((file) => file.id)
  const reading = files.filter((file) => file.reading).length
  useEffect(() => writePreference('atlas:audio:likes', likes), [likes])
  useEffect(() => {
    if (!sleepUntil) return
    const timer = setTimeout(
      () => {
        player.current?.pause()
        setSleepUntil(null)
      },
      Math.max(0, sleepUntil - Date.now()),
    )
    return () => clearTimeout(timer)
  }, [sleepUntil])

  function select(id: string, play = playing, record = true) {
    if (!files.some((file) => file.id === id)) return
    if (file && record) {
      navigation.current.sync(ids)
      navigation.current.visit(file.id, id)
    }
    if (id === file?.id) {
      if (play) void player.current?.play().catch(() => {})
      return
    }
    elapsed.current = 0
    setAutoPlay(play)
    setActiveId(id)
  }
  function next(ended = false) {
    if (!file) return
    const id = navigation.current.next(file.id, ids, repeat, shuffle, ended)
    if (id) {
      if (id === file.id) player.current?.seek(0)
      select(id, ended || playing)
    } else if (ended) {
      setPlaying(false)
      setAutoPlay(false)
    }
  }
  function previous() {
    if (!file || elapsed.current > 3) {
      player.current?.seek(0)
      return
    }
    const id = navigation.current.previous(file.id, ids, shuffle)
    if (id) select(id, playing, false)
    else player.current?.seek(0)
  }
  function remove(id: string) {
    if (file?.id === id) {
      player.current?.pause()
      const replacement = files[index + 1] ?? files[index - 1]
      setActiveId(replacement?.id ?? null)
      setAutoPlay(playing && !!replacement)
      elapsed.current = 0
    }
    library.remove(id)
  }
  function importFiles(input: File[], replace = false) {
    const added = library.add(input, replace)
    if (!added.length) return
    if (replace) {
      player.current?.pause()
      navigation.current.reset()
      setActiveId(added[0].id)
      setAutoPlay(false)
    }
    setImported(true)
    if (!files.length) setActiveId(added[0].id)
  }
  const expandedContent = files.length > 0 && (
    <>
      <div className="morph-audio-demo__options">
        <button
          type="button"
          aria-pressed={shuffle}
          onClick={() => {
            navigation.current.reset()
            setShuffle(!shuffle)
          }}
        >
          Shuffle
        </button>
        <label>
          Repeat
          <select
            aria-label="Repeat mode"
            value={repeat}
            onChange={(event) => setRepeat(event.target.value as RepeatMode)}
          >
            <option value="off">Off</option>
            <option value="all">All</option>
            <option value="one">One</option>
          </select>
        </label>
        <label>
          Speed
          <select
            aria-label="Audio speed"
            value={preferences.rate}
            onChange={(event) =>
              setPreferences((current) => ({ ...current, rate: Number(event.target.value) }))
            }
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <option key={rate} value={rate}>
                {rate}×
              </option>
            ))}
          </select>
        </label>
        <label>
          Sleep
          <select
            aria-label="Sleep timer"
            value={sleepUntil ? 'active' : 'off'}
            onChange={(event) =>
              setSleepUntil(
                event.target.value === 'off'
                  ? null
                  : Date.now() + Number(event.target.value) * 60000,
              )
            }
          >
            <option value="off">Off</option>
            {sleepUntil && (
              <option value="active">
                Until{' '}
                {new Date(sleepUntil).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </option>
            )}
            {[15, 30, 60].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="morph-audio-demo__queue-heading">
        <span>{files.length} tracks</span>
        <button
          type="button"
          onClick={() => {
            player.current?.pause()
            library.clear()
            navigation.current.reset()
            setActiveId(null)
            setAutoPlay(false)
            setSleepUntil(null)
          }}
        >
          Clear queue
        </button>
      </div>
      <ol className="morph-audio-demo__queue" aria-label="Playlist">
        {files.map((track, trackIndex) => (
          <li key={track.id}>
            <button
              className="morph-audio-demo__track"
              type="button"
              aria-current={file?.id === track.id ? 'true' : undefined}
              onClick={() => select(track.id, true)}
              title={track.title || track.name}
            >
              <span aria-hidden="true">
                {file?.id === track.id && playing ? '♫' : String(trackIndex + 1).padStart(2, '0')}
              </span>
              <span>
                <strong>{track.title || track.name}</strong>
                <small>{track.reading ? 'Reading tags…' : track.artist || 'Local audio'}</small>
              </span>
            </button>
            <div className="morph-audio-demo__track-actions">
              <button
                type="button"
                aria-label={`Move up ${track.name}`}
                title="Move up"
                disabled={trackIndex === 0}
                onClick={() => library.move(track.id, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move down ${track.name}`}
                title="Move down"
                disabled={trackIndex === files.length - 1}
                onClick={() => library.move(track.id, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={`Remove ${track.name}`}
                title="Remove"
                onClick={() => remove(track.id)}
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ol>
    </>
  )
  return (
    <div
      className="morph-audio-demo"
      data-dragging={dragging}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('Files')) {
          event.preventDefault()
          setDragging(true)
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        importFiles(Array.from(event.dataTransfer.files))
      }}
    >
      {dragging && <div className="morph-audio-demo__drop">Drop audio to add to the queue</div>}
      {file || !imported ? (
        <AudioPlayer
          ref={player}
          expandedContent={expandedContent}
          src={file?.url}
          title={file?.title || file?.name || 'Cabra Field'}
          subtitle={
            file ? [file.artist, file.album].filter(Boolean).join(' · ') || 'Local audio' : 'Side B'
          }
          artwork={file ? file.artwork : cover}
          artworkLoading={file?.reading}
          autoPlay={autoPlay}
          initialExpanded={expanded}
          volume={preferences.volume}
          muted={preferences.muted}
          playbackRate={preferences.rate}
          playbackGroup="atlas-media"
          mediaSession
          liked={likes.includes(file?.fingerprint ?? 'demo')}
          onLikedChange={(liked) => {
            const key = file?.fingerprint ?? 'demo'
            setLikes((current) =>
              liked ? [...new Set([...current, key])] : current.filter((id) => id !== key),
            )
          }}
          onVolumeChange={(volume, muted) =>
            setPreferences((current) => ({ ...current, volume, muted }))
          }
          onTimeChange={(time) => {
            elapsed.current = time
          }}
          onExpandedChange={setExpanded}
          onPlayingChange={setPlaying}
          onPrevious={file ? previous : undefined}
          onNext={
            file && (shuffle || index < files.length - 1 || repeat === 'all')
              ? () => next()
              : undefined
          }
          onEnded={() => next(true)}
        />
      ) : (
        <div className="morph-audio-demo__empty">
          <strong>Your queue is empty</strong>
          <span>Add audio files or drop them here.</span>
        </div>
      )}
      <div className="morph-audio-demo__library">
        <div className="morph-audio-demo__actions">
          <AudioFilePicker
            label={files.length ? 'Add audio' : 'Open audio'}
            onFiles={importFiles}
          />
          {files.length > 0 && (
            <AudioFilePicker label="Replace queue" onFiles={(input) => importFiles(input, true)} />
          )}
        </div>
        {(reading > 0 || library.message) && (
          <p className="morph-audio-demo__status" role="status">
            {reading
              ? `Reading tags for ${reading} ${reading === 1 ? 'track' : 'tracks'}…`
              : library.message}
          </p>
        )}
      </div>
    </div>
  )
}
