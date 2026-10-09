import { useEffect, useRef, useState } from 'react';
import { AudioPlayer } from '..';
import type { AudioPlayerHandle } from '..';
import { AudioFilePicker } from './AudioFilePicker';
import { useAudioLibrary } from './useAudioLibrary';
import { QueueNavigation } from './queue';
import type { RepeatMode } from './queue';
import { useMediaPreferences, readPreference, writePreference } from './preferences';
import { DemoIcon } from './icons';
import cover from './cover.jpg';
import './styles.css';

const repeatModes: RepeatMode[] = ['off', 'all', 'one'];
const repeatLabels: Record<RepeatMode, string> = {
  off: 'Repeat',
  all: 'Repeat all',
  one: 'Repeat one',
};

/** Tag title, else the file name without its extension. */
function trackTitle(track: { title?: string; name: string }) {
  return track.title || track.name.replace(/\.[^.]+$/, '') || track.name;
}

/** Tag artist, else the file format, e.g. "WAV file". */
function trackDetail(track: { artist?: string; name: string }) {
  const extension = /\.([^.]+)$/.exec(track.name)?.[1];
  return track.artist || (extension ? `${extension.toUpperCase()} file` : 'Local audio');
}

export default function AudioPlayerShowcase() {
  const library = useAudioLibrary();
  const { files } = library;
  const player = useRef<AudioPlayerHandle>(null);
  const navigation = useRef(new QueueNavigation());
  const elapsed = useRef(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [imported, setImported] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [shuffle, setShuffle] = useState(false);
  const [sleepUntil, setSleepUntil] = useState<number | null>(null);
  const [preferences, setPreferences] = useMediaPreferences('atlas:audio:preferences');
  const [likes, setLikes] = useState<string[]>(() => {
    const stored = readPreference<unknown>('atlas:audio:likes', []);
    return Array.isArray(stored)
      ? stored.filter((value): value is string => typeof value === 'string')
      : [];
  });
  const index = Math.max(
    0,
    files.findIndex(file => file.id === activeId),
  );
  const file = files[index];
  const ids = files.map(file => file.id);
  const reading = files.filter(file => file.reading).length;
  useEffect(() => writePreference('atlas:audio:likes', likes), [likes]);
  useEffect(() => {
    if (!sleepUntil) return;
    const timer = setTimeout(
      () => {
        player.current?.pause();
        setSleepUntil(null);
      },
      Math.max(0, sleepUntil - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [sleepUntil]);

  function select(id: string, play = playing, record = true) {
    if (!files.some(file => file.id === id)) return;
    if (file && record) {
      navigation.current.sync(ids);
      navigation.current.visit(file.id, id);
    }
    if (id === file?.id) {
      if (play) void player.current?.play().catch(() => {});
      return;
    }
    elapsed.current = 0;
    setAutoPlay(play);
    setActiveId(id);
  }
  function next(ended = false) {
    if (!file) return;
    const id = navigation.current.next(file.id, ids, repeat, shuffle, ended);
    if (id) {
      if (id === file.id) player.current?.seek(0);
      select(id, ended || playing);
    } else if (ended) {
      setPlaying(false);
      setAutoPlay(false);
    }
  }
  function previous() {
    if (!file || elapsed.current > 3) {
      player.current?.seek(0);
      return;
    }
    const id = navigation.current.previous(file.id, ids, shuffle);
    if (id) select(id, playing, false);
    else player.current?.seek(0);
  }
  function remove(id: string) {
    if (file?.id === id) {
      player.current?.pause();
      const replacement = files[index + 1] ?? files[index - 1];
      setActiveId(replacement?.id ?? null);
      setAutoPlay(playing && !!replacement);
      elapsed.current = 0;
    }
    library.remove(id);
  }
  function importFiles(input: File[], replace = false) {
    const added = library.add(input, replace);
    if (!added.length) return;
    if (replace) {
      player.current?.pause();
      navigation.current.reset();
      setActiveId(added[0].id);
      setAutoPlay(false);
    }
    setImported(true);
    if (!files.length) setActiveId(added[0].id);
  }
  const expandedContent = files.length > 0 && (
    <>
      <div className="audio-player-demo__options">
        <button
          type="button"
          aria-pressed={shuffle}
          onClick={() => {
            navigation.current.reset();
            setShuffle(!shuffle);
          }}
        >
          <DemoIcon name="shuffle" />
          Shuffle
        </button>
        <button
          type="button"
          aria-pressed={repeat !== 'off'}
          aria-label={`Repeat ${repeat}`}
          title="Change repeat mode"
          onClick={() => setRepeat(repeatModes[(repeatModes.indexOf(repeat) + 1) % 3])}
        >
          <span className="audio-player-demo__repeat-icon" data-mode={repeat}>
            <DemoIcon name="repeat" />
          </span>
          {repeatLabels[repeat]}
        </button>
        <label data-active={sleepUntil !== null}>
          <DemoIcon name="sleep" />
          <span>Sleep</span>
          <select
            aria-label="Sleep timer"
            value={sleepUntil ? 'active' : 'off'}
            onChange={event =>
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
            {[15, 30, 60].map(minutes => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="audio-player-demo__queue-heading">
        <span>
          {files.length} {files.length === 1 ? 'track' : 'tracks'}
        </span>
        <button
          type="button"
          onClick={() => {
            player.current?.pause();
            library.clear();
            navigation.current.reset();
            setActiveId(null);
            setAutoPlay(false);
            setSleepUntil(null);
          }}
        >
          Clear queue
        </button>
      </div>
      <ol className="audio-player-demo__queue" aria-label="Playlist">
        {files.map((track, trackIndex) => (
          <li key={track.id}>
            <button
              className="audio-player-demo__track"
              type="button"
              aria-current={file?.id === track.id ? 'true' : undefined}
              onClick={() => select(track.id, true)}
              title={trackTitle(track)}
            >
              <span aria-hidden="true">
                {file?.id === track.id && playing ? (
                  <span className="audio-player-demo__playing">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  String(trackIndex + 1).padStart(2, '0')
                )}
              </span>
              <span>
                <strong>{trackTitle(track)}</strong>
                <small>{track.reading ? 'Reading tags…' : trackDetail(track)}</small>
              </span>
            </button>
            <div className="audio-player-demo__track-actions">
              <button
                type="button"
                aria-label={`Move up ${trackTitle(track)}`}
                title="Move up"
                disabled={trackIndex === 0}
                onClick={() => library.move(track.id, -1)}
              >
                <DemoIcon name="up" size={15} />
              </button>
              <button
                type="button"
                aria-label={`Move down ${trackTitle(track)}`}
                title="Move down"
                disabled={trackIndex === files.length - 1}
                onClick={() => library.move(track.id, 1)}
              >
                <DemoIcon name="down" size={15} />
              </button>
              <button
                type="button"
                aria-label={`Remove ${trackTitle(track)}`}
                title="Remove"
                onClick={() => remove(track.id)}
              >
                <DemoIcon name="remove" size={15} />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
  return (
    <div
      className="audio-player-demo"
      data-dragging={dragging}
      onDragOver={event => {
        if (event.dataTransfer.types.includes('Files')) {
          event.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={event => {
        event.preventDefault();
        setDragging(false);
        importFiles(Array.from(event.dataTransfer.files));
      }}
    >
      {dragging && <div className="audio-player-demo__drop">Drop audio to add to the queue</div>}
      {file || !imported ? (
        <AudioPlayer
          ref={player}
          expandedContent={expandedContent}
          src={file?.url}
          title={file ? trackTitle(file) : 'Cabra Field'}
          subtitle={
            file
              ? [file.artist, file.album].filter(Boolean).join(' · ') || trackDetail(file)
              : 'Side B'
          }
          artwork={file ? file.artwork : cover}
          artworkLoading={file?.reading}
          autoPlay={autoPlay}
          initialExpanded={expanded}
          volume={preferences.volume}
          muted={preferences.muted}
          playbackRate={preferences.rate}
          onPlaybackRateChange={rate => setPreferences(current => ({ ...current, rate }))}
          playbackGroup="atlas-media"
          mediaSession
          liked={likes.includes(file?.fingerprint ?? 'demo')}
          onLikedChange={liked => {
            const key = file?.fingerprint ?? 'demo';
            setLikes(current =>
              liked ? [...new Set([...current, key])] : current.filter(id => id !== key),
            );
          }}
          onVolumeChange={(volume, muted) =>
            setPreferences(current => ({ ...current, volume, muted }))
          }
          onTimeChange={time => {
            elapsed.current = time;
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
        <div className="audio-player-demo__empty">
          <strong>Your queue is empty</strong>
          <span>Add audio files or drop them here.</span>
        </div>
      )}
      <div className="audio-player-demo__library">
        <div className="audio-player-demo__actions">
          <AudioFilePicker
            label={files.length ? 'Add audio' : 'Open audio'}
            icon="add"
            onFiles={importFiles}
          />
          {files.length > 0 && (
            <AudioFilePicker
              label="Replace queue"
              icon="replace"
              onFiles={input => importFiles(input, true)}
            />
          )}
        </div>
        {(reading > 0 || library.message) && (
          <p className="audio-player-demo__status" role="status">
            {reading
              ? `Reading tags for ${reading} ${reading === 1 ? 'track' : 'tracks'}…`
              : library.message}
          </p>
        )}
      </div>
    </div>
  );
}
