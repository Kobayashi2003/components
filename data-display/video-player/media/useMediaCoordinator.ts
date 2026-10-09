import { useEffect, useEffectEvent, useRef } from 'react';
import type { RefObject } from 'react';

const actions: MediaSessionAction[] = [
  'play',
  'pause',
  'seekbackward',
  'seekforward',
  'seekto',
  'previoustrack',
  'nexttrack',
];

export function useMediaCoordinator(
  ref: RefObject<HTMLMediaElement | null>,
  options: {
    group?: string;
    enabled?: boolean;
    title: string;
    artist?: string;
    artwork?: string;
    onPrevious?: () => void;
    onNext?: () => void;
  },
) {
  const previous = useEffectEvent(() => options.onPrevious?.());
  const restoreOwner = useRef(false);
  const next = useEffectEvent(() => options.onNext?.());
  const hasPrevious = !!options.onPrevious;
  const hasNext = !!options.onNext;
  useEffect(() => {
    const media = ref.current;
    if (!media) return;
    const session = options.enabled && 'mediaSession' in navigator ? navigator.mediaSession : null;
    let ownsSession = false;
    const relinquish = (event: Event) => {
      if ((event as CustomEvent).detail !== media) ownsSession = false;
    };
    document.addEventListener('atlas-media-session', relinquish);
    const update = () => {
      if (!session || !ownsSession) return;
      session.playbackState = media.paused ? 'paused' : 'playing';
      if (Number.isFinite(media.duration) && media.duration > 0) {
        try {
          session.setPositionState({
            duration: media.duration,
            playbackRate: media.playbackRate,
            position: Math.min(media.duration, Math.max(0, media.currentTime)),
          });
        } catch {
          /* Position reporting is optional. */
        }
      }
    };
    const claim = () => {
      if (options.group && !media.paused)
        document.dispatchEvent(
          new CustomEvent('atlas-media-play', { detail: { media, group: options.group } }),
        );
      if (!session) return;
      document.dispatchEvent(new CustomEvent('atlas-media-session', { detail: media }));
      ownsSession = true;
      session.metadata = new MediaMetadata({
        title: options.title,
        artist: options.artist,
        artwork: options.artwork ? [{ src: options.artwork }] : [],
      });
      const handlers: Partial<Record<MediaSessionAction, MediaSessionActionHandler>> = {
        play: () => {
          void media.play().catch(() => {});
        },
        pause: () => media.pause(),
        seekbackward: event => {
          media.currentTime = Math.max(0, media.currentTime - (event.seekOffset ?? 10));
        },
        seekforward: event => {
          if (Number.isFinite(media.duration))
            media.currentTime = Math.min(
              media.duration,
              media.currentTime + (event.seekOffset ?? 10),
            );
        },
        seekto: event => {
          if (event.seekTime !== undefined && Number.isFinite(media.duration))
            media.currentTime = Math.max(0, Math.min(media.duration, event.seekTime));
        },
        ...(hasPrevious ? { previoustrack: () => previous() } : {}),
        ...(hasNext ? { nexttrack: () => next() } : {}),
      };
      actions.forEach(action => {
        try {
          session.setActionHandler(action, handlers[action] ?? null);
        } catch {
          /* Some media actions are not supported. */
        }
      });
      update();
    };
    const exclusive = (event: Event) => {
      const detail = (event as CustomEvent<{ media: HTMLMediaElement; group: string }>).detail;
      if (options.group && detail.group === options.group && detail.media !== media) media.pause();
    };
    document.addEventListener('atlas-media-play', exclusive);
    media.addEventListener('play', claim);
    const events = ['pause', 'timeupdate', 'ratechange', 'durationchange'];
    events.forEach(event => media.addEventListener(event, update));
    if (!media.paused || restoreOwner.current) claim();
    return () => {
      document.removeEventListener('atlas-media-session', relinquish);
      document.removeEventListener('atlas-media-play', exclusive);
      media.removeEventListener('play', claim);
      events.forEach(event => media.removeEventListener(event, update));
      restoreOwner.current = ownsSession;
      if (session && ownsSession) {
        ownsSession = false;
        session.metadata = null;
        session.playbackState = 'none';
        actions.forEach(action => {
          try {
            session.setActionHandler(action, null);
          } catch {
            /* Optional browser action. */
          }
        });
        try {
          session.setPositionState();
        } catch {
          /* Optional browser action. */
        }
      }
    };
  }, [
    ref,
    options.group,
    options.enabled,
    options.title,
    options.artist,
    options.artwork,
    hasPrevious,
    hasNext,
  ]);
}
