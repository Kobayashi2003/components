import { useEffect, useRef, useState } from 'react';
import { VideoPlayer } from '..';
import type { VideoChapter, VideoSubtitle } from '..';
import { VideoIcon } from '../components/icons';
import './styles.css';
import { useMediaPreferences, readPreference, writePreference } from './preferences';
import { usePlaybackPosition } from './usePlaybackPosition';

const sample = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const sampleChapters: VideoChapter[] = [
  { time: 0, title: 'Closed bud' },
  { time: 2.4, title: 'Opening' },
];
const sampleSubtitles: VideoSubtitle[] = [
  {
    src: `data:text/vtt;charset=utf-8,${encodeURIComponent(
      [
        'WEBVTT',
        '',
        '00:00.300 --> 00:02.300',
        'A purslane bud in the morning light',
        '',
        '00:02.500 --> 00:05.000',
        'Its petals begin to unfold',
      ].join('\n'),
    )}`,
    label: 'English (sample)',
    language: 'en',
  },
];
function savedTime(key: string) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export default function VideoPlayerShowcase() {
  const [source, setSource] = useState(() => ({
    url: sample,
    name: 'Flowers',
    key: 'video-player:sample',
    resume: savedTime('video-player:sample'),
    sample: true,
  }));
  const [subtitles, setSubtitles] = useState<VideoSubtitle[]>(sampleSubtitles);
  const [subtitleError, setSubtitleError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [preferences, setPreferences] = useMediaPreferences('atlas:video:preferences');
  const [subtitleLanguage, setSubtitleLanguage] = useState(() => {
    const value = readPreference<unknown>('atlas:video:subtitle', 'off');
    return typeof value === 'string' ? value : 'off';
  });
  const position = usePlaybackPosition(source.key, source.resume);
  const subtitleRequest = useRef(0);
  useEffect(
    () => () => {
      subtitleRequest.current += 1;
    },
    [],
  );
  useEffect(
    () => () => {
      if (source.url.startsWith('blob:')) URL.revokeObjectURL(source.url);
    },
    [source],
  );
  useEffect(
    () => () => {
      subtitles.forEach(track => {
        if (track.src.startsWith('blob:')) URL.revokeObjectURL(track.src);
      });
    },
    [subtitles],
  );
  function openVideo(file: File) {
    if (
      !file.size ||
      !(file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name))
    ) {
      setSubtitleError('Choose a non-empty video file.');
      return;
    }
    subtitleRequest.current += 1;
    setSubtitleError('');
    const key = `video-player:${file.name}:${file.size}:${file.lastModified}`;
    setSource({
      url: URL.createObjectURL(file),
      name: file.name,
      key,
      resume: savedTime(key),
      sample: false,
    });
    setSubtitles([]);
  }
  return (
    <section
      className="video-player-demo"
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
        const files = Array.from(event.dataTransfer.files);
        if (files.length === 1) openVideo(files[0]);
        else setSubtitleError('Choose one video at a time.');
      }}
    >
      {dragging && <div className="video-player-demo__drop">Drop a video to open it</div>}
      <div className="video-player-demo__tools">
        <span className="video-player-demo__filename" title={source.name}>
          {source.name}
        </span>
        <div className="video-player-demo__actions">
          <label>
            <VideoIcon name="upload" size={16} /> Open video
            <input
              type="file"
              accept="video/*"
              onChange={event => {
                const file = event.currentTarget.files?.[0];
                if (file) openVideo(file);
                event.currentTarget.value = '';
              }}
            />
          </label>
          <label className="video-player-demo__subtitle">
            CC
            <input
              type="file"
              accept=".vtt,text/vtt"
              aria-label="Open subtitles"
              onChange={async event => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                if (!file) return;
                const request = ++subtitleRequest.current;
                setSubtitleError('');
                try {
                  const text = await file.text();
                  if (request !== subtitleRequest.current) return;
                  if (!/^\uFEFF?WEBVTT(?:[ \t]|\r?\n|$)/.test(text)) {
                    setSubtitleError('Choose a valid WebVTT (.vtt) subtitle file.');
                    return;
                  }
                  const blob = new Blob([text], { type: 'text/vtt' });
                  setSubtitles([
                    { src: URL.createObjectURL(blob), label: file.name, language: 'und' },
                  ]);
                } catch {
                  if (request === subtitleRequest.current)
                    setSubtitleError('Unable to read this subtitle file.');
                }
              }}
            />
          </label>
        </div>
      </div>
      {subtitleError && (
        <p className="video-player-demo__error" role="alert">
          {subtitleError}
        </p>
      )}
      <VideoPlayer
        src={source.url}
        title={source.name}
        subtitles={subtitles}
        chapters={source.sample ? sampleChapters : undefined}
        resumeTime={source.resume}
        {...position}
        defaultVolume={preferences.volume}
        muted={preferences.muted}
        playbackRate={preferences.rate}
        playbackGroup="atlas-media"
        mediaSession
        defaultSubtitle={subtitleLanguage}
        onSubtitleChange={language => {
          setSubtitleLanguage(language ?? 'off');
          writePreference('atlas:video:subtitle', language ?? 'off');
        }}
        onVolumeChange={(volume, muted) =>
          setPreferences(current => ({ ...current, volume, muted }))
        }
        onRateChange={rate => setPreferences(current => ({ ...current, rate }))}
      />
    </section>
  );
}
