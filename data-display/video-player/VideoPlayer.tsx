import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, Ref } from 'react';
import { VideoIcon } from './components/icons';
import type { VideoIconName } from './components/icons';
import { PlayerSettings } from './components/PlayerSettings';
import { useDeferredSeek } from './media/useDeferredSeek';
import { useMediaCoordinator } from './media/useMediaCoordinator';
import {
  clamp,
  formatMediaTime as formatTime,
  mediaDuration,
  mediaError,
  readBuffered,
} from './media/playback';

export interface VideoSubtitle {
  src: string;
  label: string;
  language: string;
}

export interface VideoChapter {
  time: number;
  title: string;
}

export interface VideoThumbnail {
  start: number;
  end: number;
  src: string;
}

export interface VideoPlayerHandle {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  initialTime?: number;
  defaultVolume?: number;
  playbackRates?: readonly number[];
  seekStep?: number;
  subtitles?: readonly VideoSubtitle[];
  resumeTime?: number;
  chapters?: readonly VideoChapter[];
  thumbnails?: readonly VideoThumbnail[];
  playbackRate?: number;
  playbackGroup?: string;
  mediaSession?: boolean;
  defaultSubtitle?: string;
  touchGestures?: boolean;
  doubleClickFullscreen?: boolean;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onRateChange?: (rate: number) => void;
  onSubtitleChange?: (language: string | null) => void;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<VideoPlayerHandle>;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeChange?: (time: number, duration: number) => void;
  onError?: (error: Error) => void;
}

interface Flash {
  id: number;
  icon: VideoIconName;
  text: string;
  side?: 'left' | 'right';
}

type WebkitVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };
type LockableOrientation = ScreenOrientation & { lock?: (orientation: string) => Promise<void> };

const emptySubtitles: readonly VideoSubtitle[] = [];
const emptyChapters: readonly VideoChapter[] = [];
const emptyThumbnails: readonly VideoThumbnail[] = [];
const defaultRates = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const frame = 1 / 30;

export function VideoPlayer(props: VideoPlayerProps) {
  return <VideoPlayerSession key={props.src} {...props} />;
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
  playbackRates = defaultRates,
  seekStep = 10,
  subtitles = emptySubtitles,
  resumeTime = 0,
  chapters = emptyChapters,
  thumbnails = emptyThumbnails,
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const playRequest = useRef(0);
  const keyboardMode = useRef(false);
  const revealOnly = useRef(false);
  const lastPointer = useRef('mouse');
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tap = useRef({ at: 0, side: 0, x: 0, y: 0 });
  const streak = useRef({ side: 0, until: 0, amount: 0 });
  const lastCaption = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [waitingVisible, setWaitingVisible] = useState(false);
  const [ended, setEnded] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState<[number, number][]>([]);
  const [volume, setVolume] = useState(() => clamp(defaultVolume, 0, 1, 1));
  const [isMuted, setIsMuted] = useState(muted);
  const [rate, setRate] = useState(1);
  const [visible, setVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [pip, setPip] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [flash, setFlash] = useState<Flash | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [caption, setCaption] = useState(defaultSubtitle ?? 'off');
  const [captionLines, setCaptionLines] = useState<{ src: string; lines: string[] }>({
    src: 'off',
    lines: [],
  });
  const [captionSize, setCaptionSize] = useState(1);
  const [captionBackground, setCaptionBackground] = useState(0.7);
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState(false);
  const [fit, setFit] = useState<'contain' | 'cover'>('contain');
  const [repeatOverride, setRepeat] = useState<boolean>();
  const repeat = repeatOverride ?? loop;
  const step = Number.isFinite(seekStep) && seekStep > 0 ? Math.round(seekStep) : 10;
  const drag = useDeferredSeek(
    videoRef,
    value => {
      setTime(value);
      setPreview(value);
    },
    seek,
  );
  const scrubbing = drag.active;
  const isScrubbing = drag.dragging;
  const controlsVisible = visible || !playing || !!error || settingsOpen || isScrubbing;
  const activeCaption =
    subtitles.find(track => track.src === caption || track.language === caption)?.src ?? 'off';
  const validChapters = chapters
    .filter(
      chapter => Number.isFinite(chapter.time) && chapter.time >= 0 && chapter.time < duration,
    )
    .filter(
      (chapter, index, values) => values.findIndex(item => item.time === chapter.time) === index,
    )
    .sort((a, b) => a.time - b.time);
  const chapterAt = (at: number) =>
    validChapters.reduce<VideoChapter | undefined>(
      (match, chapter) => (chapter.time <= at ? chapter : match),
      undefined,
    );
  const currentChapter = chapterAt(time);
  const previewChapter = preview === null ? undefined : chapterAt(preview);
  const thumbnail =
    preview === null
      ? undefined
      : thumbnails.find(item => preview >= item.start && preview < item.end);
  const showResume = !resumeDismissed && !playing && resumeTime > 3 && duration > resumeTime + 3;
  const pipSupported = typeof document !== 'undefined' && document.pictureInPictureEnabled;
  const fullscreenSupported =
    typeof document !== 'undefined' &&
    (document.fullscreenEnabled ||
      (typeof HTMLVideoElement !== 'undefined' &&
        'webkitEnterFullscreen' in HTMLVideoElement.prototype));
  const rates = [
    ...new Set([1, rate, ...playbackRates.filter(value => Number.isFinite(value) && value > 0)]),
  ].sort((a, b) => a - b);
  const silenced = isMuted || volume === 0;

  useMediaCoordinator(videoRef, {
    group: playbackGroup,
    enabled: mediaSession,
    title,
    artwork: poster,
  });

  useEffect(
    () => () => {
      clearTimeout(hideTimer.current);
      clearTimeout(tapTimer.current);
    },
    [],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(playbackRate) || playbackRate <= 0) return;
    try {
      video.defaultPlaybackRate = playbackRate;
      video.playbackRate = playbackRate;
    } catch {
      /* Preserve the supported native rate. */
    }
  }, [playbackRate]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.volume = clamp(defaultVolume, 0, 1, 1);
  }, [defaultVolume]);

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setWaitingVisible(true), 250);
    return () => clearTimeout(timer);
  }, [waiting]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const enter = () => setPip(true);
    const leave = () => setPip(false);
    video.addEventListener('enterpictureinpicture', enter);
    video.addEventListener('leavepictureinpicture', leave);
    return () => {
      video.removeEventListener('enterpictureinpicture', enter);
      video.removeEventListener('leavepictureinpicture', leave);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = Array.from(video.querySelectorAll('track'));
    const selected = tracks.find(element => element.getAttribute('src') === activeCaption);
    // Picture-in-picture cannot show the custom overlay, so native rendering takes over there.
    tracks.forEach(element => {
      element.track.mode = element === selected ? (pip ? 'showing' : 'hidden') : 'disabled';
    });
    const updateCues = () => {
      const lines = Array.from(selected?.track.activeCues ?? []).map(cueText);
      setCaptionLines(current =>
        current.src === activeCaption &&
        current.lines.length === lines.length &&
        current.lines.every((line, index) => line === lines[index])
          ? current
          : { src: activeCaption, lines },
      );
    };
    updateCues();
    selected?.track.addEventListener('cuechange', updateCues);
    selected?.addEventListener('load', updateCues);
    return () => {
      selected?.track.removeEventListener('cuechange', updateCues);
      selected?.removeEventListener('load', updateCues);
    };
  }, [activeCaption, subtitles, pip]);

  // Cached media can load before React commits the element's listeners; catch up once mounted.
  const catchUpMetadata = useEffectEvent(() => {
    const video = videoRef.current;
    if (video && video.readyState >= HTMLMediaElement.HAVE_METADATA) applyMetadata(video);
  });
  useEffect(() => {
    catchUpMetadata();
  }, []);

  function applyMetadata(video: HTMLVideoElement) {
    setDuration(mediaDuration(video));
    setBuffered(readBuffered(video));
    if (initialTime > 0 && Number.isFinite(video.duration))
      video.currentTime = clamp(initialTime, 0, video.duration);
  }

  function showFlash(icon: VideoIconName, text: string, side?: Flash['side']) {
    setFlash(current => ({ id: (current?.id ?? 0) + 1, icon, text, side }));
  }

  function finishWaiting() {
    setWaiting(false);
    setWaitingVisible(false);
  }

  function hideIfIdle() {
    const root = rootRef.current;
    const focused = document.activeElement;
    if (
      scrubbing.current ||
      (keyboardMode.current && focused !== root && root?.contains(focused)) ||
      controlsRef.current?.matches(':hover')
    )
      return;
    setVisible(false);
  }

  function reveal() {
    clearTimeout(hideTimer.current);
    setVisible(true);
    if (videoRef.current && !videoRef.current.paused)
      hideTimer.current = setTimeout(hideIfIdle, 2600);
  }

  function conceal() {
    clearTimeout(hideTimer.current);
    if (videoRef.current && !videoRef.current.paused && !scrubbing.current) setVisible(false);
  }

  function reportError(cause: unknown) {
    const failure = cause instanceof Error ? cause : new Error('Video loading failed');
    finishWaiting();
    setVisible(true);
    if (failure.name === 'NotAllowedError') setNotice('Press Play to start this video.');
    else setError(mediaError(videoRef.current?.error ?? null));
    onError?.(failure);
  }

  async function play() {
    const video = videoRef.current;
    if (!video) return;
    const request = ++playRequest.current;
    setError('');
    try {
      await video.play();
    } catch (cause) {
      if (
        videoRef.current === video &&
        request === playRequest.current &&
        !(cause instanceof Error && cause.name === 'AbortError')
      )
        reportError(cause);
      throw cause;
    }
  }

  function pause() {
    playRequest.current += 1;
    videoRef.current?.pause();
  }

  function togglePlay(feedback = true) {
    const video = videoRef.current;
    if (!video) return;
    if (feedback) showFlash(video.paused ? 'play' : 'pause', video.paused ? 'Play' : 'Pause');
    if (video.paused) void play().catch(() => {});
    else pause();
  }

  function seek(nextTime: number) {
    const video = videoRef.current;
    if (!video || !(video.duration > 0)) return;
    video.currentTime = clamp(nextTime, 0, mediaDuration(video) || video.duration);
    setTime(video.currentTime);
    onTimeChange?.(video.currentTime, mediaDuration(video));
  }

  function seekBy(seconds: number, label = Math.abs(seconds)) {
    const video = videoRef.current;
    if (!video || !duration) return;
    seek(video.currentTime + seconds);
    showFlash(seconds < 0 ? 'back' : 'forward', `${label} seconds`, seconds < 0 ? 'left' : 'right');
  }

  useImperativeHandle(ref, () => ({ play, pause, seek }));

  async function toggleFullscreen() {
    const root = rootRef.current;
    const video = videoRef.current as WebkitVideo | null;
    if (!root || !video) return;
    try {
      if (document.fullscreenElement === root) await document.exitFullscreen();
      else if (document.fullscreenEnabled) {
        await root.requestFullscreen();
        if (video.videoWidth > video.videoHeight && matchMedia('(pointer: coarse)').matches)
          await (screen.orientation as LockableOrientation).lock?.('landscape').catch(() => {});
      } else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      else throw new Error('Fullscreen unsupported');
    } catch {
      setNotice('Unable to switch fullscreen. Check your browser permissions.');
      reveal();
    }
  }

  async function togglePip() {
    const video = videoRef.current;
    if (!video || !pipSupported) return;
    try {
      if (document.pictureInPictureElement === video) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      setNotice('Picture-in-picture is unavailable for this video.');
    }
  }

  function changeVolume(nextVolume: number, feedback = false) {
    const video = videoRef.current;
    if (!video) return;
    video.volume = clamp(nextVolume, 0, 1);
    video.muted = false;
    if (feedback) {
      const percent = Math.round(video.volume * 100);
      showFlash(percent === 0 ? 'muted' : percent < 50 ? 'volume-low' : 'volume', `${percent}%`);
    }
  }

  function toggleMute(feedback = false) {
    const video = videoRef.current;
    if (!video) return;
    if (video.volume === 0) {
      video.volume = 0.5;
      video.muted = false;
    } else video.muted = !video.muted;
    if (feedback)
      showFlash(
        video.muted ? 'muted' : 'volume',
        video.muted ? 'Muted' : `${Math.round(video.volume * 100)}%`,
      );
  }

  function changeRate(value: number) {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.playbackRate = value;
      return true;
    } catch {
      setNotice('This speed is not supported by your browser.');
      return false;
    }
  }

  function stepRate(direction: 1 | -1) {
    const next = rates[rates.indexOf(rate) + direction];
    if (next !== undefined && changeRate(next)) showFlash('speed', `${next}×`);
  }

  function selectCaption(value: string) {
    if (activeCaption !== 'off') lastCaption.current = activeCaption;
    setCaption(value);
    onSubtitleChange?.(subtitles.find(track => track.src === value)?.language ?? null);
  }

  function toggleCaptions() {
    if (!subtitles.length) return false;
    const fallback = subtitles.some(track => track.src === lastCaption.current)
      ? lastCaption.current!
      : subtitles[0].src;
    const next = activeCaption === 'off' ? fallback : 'off';
    selectCaption(next);
    showFlash('captions', next === 'off' ? 'Subtitles off' : 'Subtitles on');
    return true;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Tab') reveal();
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target !== event.currentTarget && event.target !== videoRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (event.repeat && [' ', 'k', 'm', 'f', 'c', 'i'].includes(key)) return;
    switch (key) {
      case ' ':
      case 'k':
        togglePlay();
        break;
      case 'ArrowLeft':
        seekBy(-5);
        break;
      case 'ArrowRight':
        seekBy(5);
        break;
      case 'j':
        seekBy(-step);
        break;
      case 'l':
        seekBy(step);
        break;
      case 'ArrowUp':
        changeVolume(video.volume + 0.05, true);
        break;
      case 'ArrowDown':
        changeVolume(video.volume - 0.05, true);
        break;
      case 'm':
        toggleMute(true);
        break;
      case 'f':
        void toggleFullscreen();
        break;
      case 'c':
        if (!toggleCaptions()) return;
        break;
      case 'i':
        void togglePip();
        break;
      case '>':
        stepRate(1);
        break;
      case '<':
        stepRate(-1);
        break;
      case '.':
      case ',':
        if (!video.paused) return;
        seek(video.currentTime + (key === '.' ? frame : -frame));
        break;
      case 'Home':
        seek(0);
        break;
      case 'End':
        seek(video.duration);
        break;
      default:
        if (!/^[0-9]$/.test(key) || !duration) return;
        seek((duration * Number(key)) / 10);
    }
    event.preventDefault();
    reveal();
  }

  function handleTouchTap(event: PointerEvent<HTMLVideoElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - bounds.left) / bounds.width;
    const side = fraction < 0.35 ? -1 : fraction > 0.65 ? 1 : 0;
    const now = performance.now();
    const run = streak.current;
    // Keep seeking while taps continue on the same side, like a held double tap.
    if (side !== 0 && run.side === side && now < run.until) {
      run.amount += step;
      run.until = now + 700;
      seekBy(side * step, run.amount);
      return;
    }
    if (now - tap.current.at < 300 && tap.current.side === side) {
      clearTimeout(tapTimer.current);
      tap.current.at = 0;
      if (side === 0) togglePlay();
      else {
        streak.current = { side, until: now + 700, amount: step };
        seekBy(side * step);
      }
      return;
    }
    tap.current.at = now;
    tap.current.side = side;
    clearTimeout(tapTimer.current);
    const wasVisible = controlsVisible && !revealOnly.current;
    tapTimer.current = setTimeout(() => (wasVisible ? conceal() : reveal()), 300);
  }

  function trackPreview(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch' && !scrubbing.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setPreview(clamp((event.clientX - bounds.left) / bounds.width, 0, 1) * duration);
  }

  const chapterMask =
    validChapters.length > 1 && duration
      ? `linear-gradient(to right, #000 0, ${validChapters
          .filter(chapter => chapter.time > 0)
          .map(chapter => {
            const at = (chapter.time / duration) * 100;
            return `#000 calc(${at}% - 1.5px), transparent calc(${at}% - 1.5px), transparent calc(${at}% + 1.5px), #000 calc(${at}% + 1.5px)`;
          })
          .join(', ')}, #000 100%)`
      : undefined;
  const percent = (value: number) => `${duration ? clamp((value / duration) * 100, 0, 100) : 0}%`;
  const state = error
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
              : 'loading';

  return (
    <div
      ref={rootRef}
      className={['video-player', className].filter(Boolean).join(' ')}
      style={style}
      role="region"
      aria-label={title}
      tabIndex={0}
      data-state={state}
      data-controls-visible={controlsVisible}
      data-settings-open={settingsOpen}
      data-fullscreen={fullscreen}
      onKeyDownCapture={() => {
        keyboardMode.current = true;
        reveal();
      }}
      onKeyDown={handleKeyDown}
      onPointerMove={event => {
        if (event.pointerType !== 'touch') reveal();
      }}
      onPointerDown={event => {
        keyboardMode.current = false;
        lastPointer.current = event.pointerType;
        revealOnly.current = !controlsVisible;
        if (event.pointerType !== 'touch' || controlsRef.current?.contains(event.target as Node))
          reveal();
      }}
      onPointerLeave={event => {
        if (event.pointerType !== 'touch') conceal();
      }}
      onFocus={reveal}
    >
      <video
        ref={videoRef}
        className="video-player__media"
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={repeat}
        preload={preload}
        playsInline
        style={{ objectFit: fit }}
        onPointerDown={event => {
          tap.current.x = event.clientX;
          tap.current.y = event.clientY;
        }}
        onPointerUp={event => {
          if (event.pointerType !== 'touch' || !touchGestures) return;
          if (Math.hypot(event.clientX - tap.current.x, event.clientY - tap.current.y) > 12) return;
          handleTouchTap(event);
        }}
        onPointerCancel={() => {
          clearTimeout(tapTimer.current);
          tap.current.at = 0;
        }}
        onClick={() => {
          if (lastPointer.current === 'touch' && touchGestures) return;
          if (revealOnly.current) reveal();
          else togglePlay();
          revealOnly.current = false;
        }}
        onDoubleClick={() => {
          if (doubleClickFullscreen && lastPointer.current !== 'touch') void toggleFullscreen();
        }}
        onLoadStart={event => {
          const video = event.currentTarget;
          setTime(video.currentTime);
          setDuration(mediaDuration(video));
          setBuffered([]);
          setPlaying(false);
          setEnded(false);
          setError('');
          finishWaiting();
          setRate(video.playbackRate);
          setVolume(video.volume);
          setIsMuted(video.muted);
          setVisible(true);
          clearTimeout(hideTimer.current);
        }}
        onLoadedMetadata={event => applyMetadata(event.currentTarget)}
        onDurationChange={event => setDuration(mediaDuration(event.currentTarget))}
        onPlay={() => {
          setPlaying(true);
          setResumeDismissed(true);
          setEnded(false);
          onPlay?.();
          reveal();
        }}
        onPlaying={finishWaiting}
        onPause={() => {
          setPlaying(false);
          finishWaiting();
          clearTimeout(hideTimer.current);
          setVisible(true);
          onPause?.();
        }}
        onWaiting={() => setWaiting(true)}
        onSeeking={() => setWaiting(true)}
        onSeeked={event => {
          finishWaiting();
          setEnded(event.currentTarget.ended);
        }}
        onCanPlay={finishWaiting}
        onEnded={() => {
          setEnded(true);
          setPlaying(false);
          finishWaiting();
          onEnded?.();
        }}
        onTimeUpdate={event => {
          const video = event.currentTarget;
          if (!scrubbing.current) setTime(video.currentTime);
          onTimeChange?.(video.currentTime, mediaDuration(video));
        }}
        onProgress={event => setBuffered(readBuffered(event.currentTarget))}
        onVolumeChange={event => {
          const video = event.currentTarget;
          setVolume(video.volume);
          setIsMuted(video.muted);
          onVolumeChange?.(video.volume, video.muted);
        }}
        onRateChange={event => {
          setRate(event.currentTarget.playbackRate);
          onRateChange?.(event.currentTarget.playbackRate);
        }}
        onError={event =>
          reportError(new Error(`Video loading failed: ${event.currentTarget.error?.code ?? 0}`))
        }
      >
        {subtitles.map(track => (
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

      {!pip && activeCaption !== 'off' && captionLines.src === activeCaption && (
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
        <span title={title}>{title}</span>
      </div>

      {flash && (
        <div
          key={flash.id}
          className="video-player__flash"
          data-side={flash.side}
          role="status"
          aria-live="polite"
        >
          <span className="video-player__flash-icon">
            <VideoIcon name={flash.icon} size={flash.side ? 26 : 30} />
          </span>
          <span
            className={
              flash.icon === 'play' || flash.icon === 'pause' ? 'video-player__sr-only' : undefined
            }
          >
            {flash.text}
          </span>
        </div>
      )}

      {notice && (
        <div className="video-player__notice" role="status">
          {notice}
        </div>
      )}

      {waiting && waitingVisible && !error && (
        <div className="video-player__spinner" role="status">
          <span className="video-player__sr-only">Buffering…</span>
        </div>
      )}

      {error && (
        <div className="video-player__error" role="alert">
          <VideoIcon name="alert" size={28} />
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              playRequest.current += 1;
              setError('');
              videoRef.current?.load();
              void play().catch(() => {});
            }}
          >
            Try again
          </button>
        </div>
      )}

      {!playing && !error && !(waiting && waitingVisible) && !isScrubbing && (
        <button
          className="video-player__start"
          type="button"
          onClick={() => togglePlay(false)}
          aria-label={ended ? 'Replay' : 'Play'}
        >
          <VideoIcon name={ended ? 'replay' : 'play'} size={ended ? 30 : 34} />
        </button>
      )}

      {showResume && !error && (
        <div className="video-player__resume" inert={!controlsVisible}>
          <button
            type="button"
            onClick={() => {
              seek(resumeTime);
              setResumeDismissed(true);
              void play().catch(() => {});
            }}
          >
            <VideoIcon name="replay" size={16} />
            Resume from {formatTime(resumeTime)}
          </button>
          <button
            type="button"
            aria-label="Dismiss resume"
            className="video-player__resume-dismiss"
            onClick={() => setResumeDismissed(true)}
          >
            ×
          </button>
        </div>
      )}

      <div ref={controlsRef} className="video-player__controls" inert={!controlsVisible}>
        <div
          className="video-player__timeline"
          data-scrubbing={isScrubbing}
          onPointerMove={trackPreview}
          onPointerLeave={() => {
            if (!scrubbing.current) setPreview(null);
          }}
        >
          {preview !== null && duration > 0 && (
            <output
              className="video-player__preview"
              style={{ left: `${clamp((preview / duration) * 100, 4, 96)}%` }}
            >
              {thumbnail && (
                <img
                  key={thumbnail.src}
                  src={thumbnail.src}
                  alt=""
                  onError={event => {
                    event.currentTarget.hidden = true;
                  }}
                />
              )}
              {previewChapter && <span>{previewChapter.title}</span>}
              <strong>{formatTime(preview)}</strong>
            </output>
          )}
          <div
            className="video-player__track"
            aria-hidden="true"
            style={chapterMask ? { maskImage: chapterMask } : undefined}
          >
            {buffered.map(([start, end]) => (
              <span
                key={start}
                className="video-player__buffer"
                style={{ left: percent(start), width: percent(end - start) }}
              />
            ))}
            {preview !== null && (
              <span className="video-player__hover" style={{ width: percent(preview) }} />
            )}
            <span className="video-player__progress" style={{ width: percent(time) }} />
          </div>
          <span
            className="video-player__thumb"
            aria-hidden="true"
            style={{ left: percent(time) }}
          />
          <input
            aria-label="Playback progress"
            aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={time}
            disabled={!duration}
            onPointerDown={event => {
              drag.begin(time);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerUp={() => {
              drag.finish();
              setPreview(null);
              reveal();
            }}
            onPointerCancel={() => {
              drag.finish(true);
              setPreview(null);
              reveal();
            }}
            onLostPointerCapture={() => {
              drag.finish(true);
              setPreview(null);
            }}
            onChange={event => drag.update(Number(event.target.value))}
          />
        </div>

        <div className="video-player__toolbar">
          <button
            type="button"
            onClick={() => togglePlay(false)}
            aria-label={playing ? 'Pause' : 'Play'}
            title={playing ? 'Pause (K)' : 'Play (K)'}
          >
            <VideoIcon name={playing ? 'pause' : 'play'} size={22} />
          </button>
          <button
            className="video-player__skip"
            type="button"
            disabled={!duration}
            onClick={() => seekBy(-step)}
            aria-label={`Back ${step} seconds`}
            title={`Back ${step} seconds (J)`}
          >
            <VideoIcon name="back" size={22} value={step} />
          </button>
          <button
            className="video-player__skip"
            type="button"
            disabled={!duration}
            onClick={() => seekBy(step)}
            aria-label={`Forward ${step} seconds`}
            title={`Forward ${step} seconds (L)`}
          >
            <VideoIcon name="forward" size={22} value={step} />
          </button>
          <div className="video-player__volume">
            <button
              type="button"
              aria-label="Mute"
              title={silenced ? 'Unmute (M)' : 'Mute (M)'}
              aria-pressed={silenced}
              onClick={() => toggleMute()}
            >
              <VideoIcon
                name={silenced ? 'muted' : volume < 0.5 ? 'volume-low' : 'volume'}
                size={22}
              />
            </button>
            <input
              aria-label="Volume"
              aria-valuetext={`${Math.round((isMuted ? 0 : volume) * 100)}%`}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              style={{ '--fill': `${(isMuted ? 0 : volume) * 100}%` } as CSSProperties}
              onChange={event => changeVolume(Number(event.target.value))}
            />
          </div>
          <button
            type="button"
            className="video-player__time"
            aria-label={remainingTime ? 'Show total duration' : 'Show remaining time'}
            onClick={() => setRemainingTime(!remainingTime)}
          >
            {formatTime(time)}
            <span>
              {remainingTime ? ` −${formatTime(duration - time)}` : ` / ${formatTime(duration)}`}
            </span>
          </button>
          {currentChapter && (
            <span className="video-player__chapter" title={currentChapter.title}>
              {currentChapter.title}
            </span>
          )}
          <div className="video-player__spacer" />
          {subtitles.length > 0 && (
            <button
              type="button"
              className="video-player__toggle"
              aria-label="Subtitles"
              aria-pressed={activeCaption !== 'off'}
              title="Subtitles (C)"
              onClick={toggleCaptions}
            >
              <VideoIcon name="captions" size={22} />
            </button>
          )}
          <button
            ref={settingsButton}
            type="button"
            className="video-player__settings-trigger"
            aria-label="Player settings"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            title="Settings"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <VideoIcon name="settings" size={21} />
            {rate !== 1 && <span className="video-player__badge">{rate}×</span>}
          </button>
          {pipSupported && (
            <button
              type="button"
              className="video-player__pip"
              aria-label={pip ? 'Exit picture-in-picture' : 'Picture-in-picture'}
              aria-pressed={pip}
              title="Picture-in-picture (I)"
              disabled={!duration}
              onClick={() => void togglePip()}
            >
              <VideoIcon name="pip" size={21} />
            </button>
          )}
          <button
            type="button"
            disabled={!fullscreenSupported}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={fullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
            onClick={() => void toggleFullscreen()}
          >
            <VideoIcon name={fullscreen ? 'collapse' : 'expand'} size={21} />
          </button>
        </div>
      </div>

      {settingsOpen && (
        <PlayerSettings
          trigger={settingsButton}
          onClose={restoreFocus => {
            setSettingsOpen(false);
            if (restoreFocus) settingsButton.current?.focus({ preventScroll: true });
            reveal();
          }}
          rates={rates}
          rate={rate}
          onRate={changeRate}
          subtitles={subtitles}
          caption={activeCaption}
          onCaption={selectCaption}
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
          currentChapter={currentChapter}
          onChapter={seek}
        />
      )}
    </div>
  );
}

function cueText(cue: TextTrackCue) {
  if (typeof VTTCue !== 'undefined' && cue instanceof VTTCue)
    return cue.getCueAsHTML().textContent ?? '';
  return (cue as TextTrackCue & { text?: string }).text ?? '';
}
