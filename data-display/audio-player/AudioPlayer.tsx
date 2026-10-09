import { useEffect, useEffectEvent, useId, useImperativeHandle, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode, Ref } from 'react';
import { AudioArtwork, AudioBackdrop } from './components/AudioArtwork';
import { PlayerIcon } from './components/icons';
import {
  clamp,
  formatMediaTime as formatTime,
  mediaDuration as readDuration,
  mediaError,
  readBuffered,
} from './media/playback';
import { useDeferredSeek } from './media/useDeferredSeek';
import { useMediaCoordinator } from './media/useMediaCoordinator';

export interface AudioPlayerHandle {
  play: () => Promise<void>;
  pause: () => void;
  seek: (seconds: number) => void;
}

export interface AudioPlayerProps {
  ref?: Ref<AudioPlayerHandle>;
  src?: string;
  title: string;
  subtitle: string;
  artwork?: string;
  artworkLoading?: boolean;
  duration?: number;
  initialTime?: number;
  expandedContent?: ReactNode;
  initialExpanded?: boolean;
  autoPlay?: boolean;
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
  playbackRates?: readonly number[];
  seekStep?: number;
  playbackGroup?: string;
  mediaSession?: boolean;
  liked?: boolean;
  onLikedChange?: (liked: boolean) => void;
  onTimeChange?: (time: number, duration: number) => void;
  onError?: (error: Error) => void;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onPlaybackRateChange?: (rate: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onEnded?: () => void;
  onPlayingChange?: (playing: boolean) => void;
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
  style?: CSSProperties;
}

const defaultRates = [0.75, 1, 1.25, 1.5, 2] as const;

function validRate(rate: number) {
  return Number.isFinite(rate) && rate > 0 ? rate : 1;
}

export function AudioPlayer(props: AudioPlayerProps) {
  return <AudioPlayerSession key={props.src} {...props} />;
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
  playbackRates = defaultRates,
  seekStep = 15,
  playbackGroup,
  mediaSession = false,
  liked: controlledLiked,
  onLikedChange,
  onTimeChange,
  onError,
  onVolumeChange,
  onPlaybackRateChange,
  onPrevious,
  onNext,
  onEnded,
  onPlayingChange,
  onExpandedChange,
  className = '',
  style,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const panelId = useId();
  const simulated = !src;
  const [mediaLength, setMediaLength] = useState(0);
  const total = simulated
    ? Number.isFinite(duration) && duration > 0
      ? duration
      : 214
    : mediaLength;
  const start = Number.isFinite(initialTime) ? Math.max(0, initialTime) : 0;
  const step = Number.isFinite(seekStep) && seekStep > 0 ? Math.round(seekStep) : 0;
  const [expanded, setExpanded] = useState(initialExpanded);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(() => (simulated ? Math.min(total, start) : 0));
  const [buffered, setBuffered] = useState<[number, number][]>([]);
  const [pointerTime, setPointerTime] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [showWaiting, setShowWaiting] = useState(false);
  const [level, setLevel] = useState(() => clamp(volume, 0, 1, 1));
  const [silent, setSilent] = useState(muted);
  const [rate, setRate] = useState(() => validRate(playbackRate));
  const [rateProp, setRateProp] = useState(playbackRate);
  const [localLiked, setLocalLiked] = useState(false);
  const liked = controlledLiked ?? localLiked;
  const elapsedRef = useRef(elapsed);
  const playRequest = useRef(0);
  const rates = [
    ...new Set([1, rate, ...playbackRates.filter(value => Number.isFinite(value) && value > 0)]),
  ].sort((a, b) => a - b);

  // A new controlled rate replaces any rate chosen from the built-in control.
  if (rateProp !== playbackRate) {
    setRateProp(playbackRate);
    setRate(validRate(playbackRate));
  }

  const drag = useDeferredSeek(audioRef, updateElapsed, seek);
  const scrubbing = drag.active;
  const seeking = drag.dragging;
  useMediaCoordinator(audioRef, {
    group: playbackGroup,
    enabled: mediaSession,
    title,
    artist: subtitle,
    artwork,
    onPrevious,
    onNext,
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.defaultPlaybackRate = rate;
      audio.playbackRate = rate;
    } catch {
      /* Unsupported rates preserve native playback. */
    }
  }, [rate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = clamp(volume, 0, 1, 1);
    audio.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setShowWaiting(true), 250);
    return () => clearTimeout(timer);
  }, [waiting]);

  const tick = useEffectEvent((seconds: number) => {
    if (scrubbing.current) return;
    const next = Math.min(total, elapsedRef.current + seconds * rate);
    updateElapsed(next);
    onTimeChange?.(next, total);
    if (next >= total) {
      changeSimulatedPlaying(false);
      onEnded?.();
    }
  });

  useEffect(() => {
    if (!playing || !simulated) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      tick((now - previous) / 1000);
      previous = now;
    }, 100);
    return () => window.clearInterval(timer);
  }, [playing, simulated]);

  // Cached media can load before React commits the element's listeners; catch up once mounted.
  const catchUpMetadata = useEffectEvent(() => {
    const audio = audioRef.current;
    if (audio && audio.readyState >= HTMLMediaElement.HAVE_METADATA) applyMetadata(audio);
  });
  useEffect(() => {
    catchUpMetadata();
  }, []);

  function applyMetadata(audio: HTMLAudioElement) {
    const length = readDuration(audio);
    setMediaLength(length);
    setBuffered(readBuffered(audio));
    if (start > 0) audio.currentTime = Math.min(length, start);
  }

  function updateElapsed(value: number) {
    elapsedRef.current = value;
    setElapsed(value);
  }

  function finishWaiting() {
    setWaiting(false);
    setShowWaiting(false);
  }

  function changeSimulatedPlaying(value: boolean) {
    setPlaying(value);
    if (value !== playing) onPlayingChange?.(value);
  }

  function seek(value: number) {
    const next = clamp(value, 0, total);
    const audio = audioRef.current;
    if (audio && total > 0) audio.currentTime = next;
    updateElapsed(next);
    if (!audio) {
      onTimeChange?.(next, total);
      if (next >= total && playing) {
        changeSimulatedPlaying(false);
        onEnded?.();
      }
    }
  }

  function skip(seconds: number) {
    seek(elapsedRef.current + seconds);
  }

  async function play() {
    const audio = audioRef.current;
    if (!audio) {
      if (elapsedRef.current >= total) updateElapsed(0);
      changeSimulatedPlaying(true);
      return;
    }
    setError('');
    const request = ++playRequest.current;
    try {
      await audio.play();
    } catch (cause) {
      if (
        audioRef.current === audio &&
        request === playRequest.current &&
        !(cause instanceof Error && cause.name === 'AbortError')
      ) {
        const failure = cause instanceof Error ? cause : new Error('Unable to play audio.');
        setError(
          failure.name === 'NotAllowedError'
            ? 'Press Play to start audio.'
            : mediaError(audio.error),
        );
        onError?.(failure);
      }
      throw cause;
    }
  }

  function pause() {
    playRequest.current += 1;
    if (audioRef.current) audioRef.current.pause();
    else changeSimulatedPlaying(false);
  }

  function togglePlay() {
    if (audioRef.current ? !audioRef.current.paused : playing) pause();
    else void play().catch(() => {});
  }

  function toggleExpanded() {
    setExpanded(!expanded);
    onExpandedChange?.(!expanded);
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.volume === 0) {
      audio.volume = 0.5;
      audio.muted = false;
    } else audio.muted = !audio.muted;
  }

  function cycleRate() {
    const next = rates[(rates.indexOf(rate) + 1) % rates.length];
    setRate(next);
    onPlaybackRateChange?.(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    if (
      target.closest('input, select, textarea, [contenteditable], .audio-player__expanded-content')
    )
      return;
    switch (event.key) {
      case 'k':
      case 'K':
        togglePlay();
        break;
      case 'ArrowLeft':
        skip(-5);
        break;
      case 'ArrowRight':
        skip(5);
        break;
      case 'm':
      case 'M':
        toggleMute();
        break;
      case 'Home':
        seek(0);
        break;
      case 'End':
        seek(total);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  function trackPointer(event: PointerEvent<HTMLInputElement>) {
    if (!total || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointerTime(clamp((event.clientX - bounds.left) / bounds.width, 0, 1) * total);
  }

  useImperativeHandle(ref, () => ({ play, pause, seek }));

  const progress = total > 0 ? clamp((elapsed / total) * 100, 0, 100) : 0;
  const bubbleTime = seeking ? elapsed : pointerTime;
  const buffering = waiting && showWaiting;
  const silenced = silent || level === 0;
  const shownLevel = silent ? 0 : level;
  const state = error
    ? 'error'
    : seeking
      ? 'seeking'
      : buffering
        ? 'buffering'
        : playing
          ? 'playing'
          : src && !mediaLength
            ? 'loading'
            : 'paused';

  const playButton = (size: number) => (
    <button
      className="audio-player__play"
      type="button"
      aria-label={playing ? 'Pause' : 'Play'}
      title={playing ? 'Pause (K)' : 'Play (K)'}
      data-busy={buffering}
      onClick={togglePlay}
    >
      <PlayerIcon name={playing ? 'pause' : 'play'} size={size} />
    </button>
  );
  const previousButton = (size: number) => (
    <button
      type="button"
      aria-label={onPrevious ? 'Previous track' : 'Restart'}
      title={onPrevious ? 'Previous track' : 'Restart'}
      onClick={onPrevious ?? (() => seek(0))}
    >
      <PlayerIcon name="previous" size={size} />
    </button>
  );
  const nextButton = (size: number) => (
    <button
      type="button"
      aria-label="Next track"
      title="Next track"
      onClick={onNext}
      disabled={!onNext}
    >
      <PlayerIcon name="next" size={size} />
    </button>
  );

  return (
    <div
      className={['audio-player', expanded && 'audio-player--expanded', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
      data-state={state}
      onKeyDown={handleKeyDown}
    >
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          autoPlay={autoPlay}
          onLoadedMetadata={event => applyMetadata(event.currentTarget)}
          onDurationChange={event => setMediaLength(readDuration(event.currentTarget))}
          onProgress={event => setBuffered(readBuffered(event.currentTarget))}
          onTimeUpdate={event => {
            const audio = event.currentTarget;
            if (scrubbing.current) return;
            updateElapsed(audio.currentTime);
            onTimeChange?.(audio.currentTime, readDuration(audio));
          }}
          onPlay={() => {
            setPlaying(true);
            onPlayingChange?.(true);
          }}
          onPlaying={finishWaiting}
          onWaiting={() => setWaiting(true)}
          onCanPlay={finishWaiting}
          onPause={() => {
            setPlaying(false);
            finishWaiting();
            onPlayingChange?.(false);
          }}
          onEnded={() => {
            setPlaying(false);
            finishWaiting();
            onEnded?.();
          }}
          onVolumeChange={event => {
            const audio = event.currentTarget;
            setLevel(audio.volume);
            setSilent(audio.muted);
            onVolumeChange?.(audio.volume, audio.muted);
          }}
          onError={event => {
            setPlaying(false);
            onPlayingChange?.(false);
            finishWaiting();
            const message = mediaError(event.currentTarget.error);
            setError(message);
            onError?.(new Error(message));
          }}
        />
      )}
      <AudioBackdrop key={artwork} src={artwork} />
      <button
        className="audio-player__surface-toggle"
        type="button"
        aria-label={expanded ? 'Collapse the player' : 'Expand the player'}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={toggleExpanded}
      />
      <div className="audio-player__content">
        <div className="audio-player__heading">
          <AudioArtwork key={artwork} src={artwork} reading={artworkLoading} />
          <div className="audio-player__metadata">
            <strong title={title}>{title}</strong>
            <span title={subtitle}>
              <span className="audio-player__eq" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {subtitle}
            </span>
          </div>
          {expanded ? (
            <button
              className="audio-player__like"
              type="button"
              aria-label={liked ? 'Remove from liked songs' : 'Add to liked songs'}
              aria-pressed={liked}
              title={liked ? 'Liked' : 'Like'}
              onClick={() => {
                setLocalLiked(!liked);
                onLikedChange?.(!liked);
              }}
            >
              <PlayerIcon name="heart" size={24} />
            </button>
          ) : (
            <div className="audio-player__transport audio-player__transport--compact">
              {previousButton(20)}
              {playButton(22)}
              {nextButton(20)}
            </div>
          )}
        </div>

        <div className="audio-player__timeline" role="group" aria-label="Playback progress">
          <div className="audio-player__rail" data-seeking={seeking}>
            {buffered.map(([from, to]) => (
              <span
                key={from}
                className="audio-player__buffer"
                style={{
                  left: `${(from / (total || 1)) * 100}%`,
                  width: `${((to - from) / (total || 1)) * 100}%`,
                }}
              />
            ))}
            <span className="audio-player__run" style={{ width: `${progress}%` }} />
            <span className="audio-player__thumb" style={{ left: `${progress}%` }} />
            {bubbleTime !== null && total > 0 && (
              <span
                className="audio-player__bubble"
                aria-hidden="true"
                style={{ left: `${clamp((bubbleTime / total) * 100, 0, 100)}%` }}
              >
                {formatTime(bubbleTime)}
              </span>
            )}
            <input
              className="audio-player__seek"
              type="range"
              min={0}
              max={total || 1}
              step={0.1}
              value={elapsed}
              disabled={!!src && !total}
              aria-label="Seek playback"
              aria-valuetext={`${formatTime(elapsed)} of ${formatTime(total)}`}
              onChange={event => drag.update(Number(event.currentTarget.value))}
              onPointerDown={event => {
                drag.begin(elapsed);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={trackPointer}
              onPointerLeave={() => setPointerTime(null)}
              onPointerUp={() => drag.finish()}
              onPointerCancel={() => drag.finish(true)}
              onLostPointerCapture={() => drag.finish(true)}
            />
          </div>
        </div>

        <div className="audio-player__panel" id={panelId} inert={!expanded}>
          <div className="audio-player__panel-inner">
            <div className="audio-player__time">
              <span>{formatTime(elapsed)}</span>
              {rates.length > 1 && (
                <button
                  className="audio-player__rate"
                  type="button"
                  aria-label={`Playback speed ${rate}×`}
                  title="Change playback speed"
                  onClick={cycleRate}
                >
                  {rate}×
                </button>
              )}
              <span>−{formatTime(total - elapsed)}</span>
            </div>
            <div className="audio-player__transport audio-player__transport--expanded">
              {step > 0 && (
                <button
                  className="audio-player__skip"
                  type="button"
                  aria-label={`Back ${step} seconds`}
                  title={`Back ${step} seconds (←)`}
                  disabled={!total}
                  onClick={() => skip(-step)}
                >
                  <PlayerIcon name="rewind" size={26} value={step} />
                </button>
              )}
              {previousButton(26)}
              {playButton(30)}
              {nextButton(26)}
              {step > 0 && (
                <button
                  className="audio-player__skip"
                  type="button"
                  aria-label={`Forward ${step} seconds`}
                  title={`Forward ${step} seconds (→)`}
                  disabled={!total}
                  onClick={() => skip(step)}
                >
                  <PlayerIcon name="forward" size={26} value={step} />
                </button>
              )}
            </div>
            {src && (
              <div className="audio-player__volume">
                <button
                  type="button"
                  aria-label="Mute"
                  title={silenced ? 'Unmute (M)' : 'Mute (M)'}
                  aria-pressed={silenced}
                  onClick={toggleMute}
                >
                  <PlayerIcon name={silenced ? 'muted' : 'volume'} size={20} />
                </button>
                <input
                  type="range"
                  aria-label="Volume"
                  min={0}
                  max={1}
                  step={0.01}
                  value={shownLevel}
                  aria-valuetext={`${Math.round(shownLevel * 100)}%`}
                  style={{ '--fill': `${shownLevel * 100}%` } as CSSProperties}
                  onChange={event => {
                    const audio = audioRef.current;
                    if (!audio) return;
                    audio.volume = Number(event.currentTarget.value);
                    audio.muted = false;
                  }}
                />
                <output aria-hidden="true">{Math.round(shownLevel * 100)}</output>
              </div>
            )}
            {expandedContent && (
              <div className="audio-player__expanded-content">{expandedContent}</div>
            )}
          </div>
        </div>

        {buffering && (
          <span className="audio-player__sr-only" role="status">
            Buffering…
          </span>
        )}
        {error && (
          <p role="alert" className="audio-player__error">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => {
                audioRef.current?.load();
                void play().catch(() => {});
              }}
            >
              Retry
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
