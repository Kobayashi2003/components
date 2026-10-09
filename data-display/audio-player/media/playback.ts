export function clamp(value: number, min: number, max: number, fallback = min) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback));
}

export function formatMediaTime(time: number) {
  const seconds = Math.floor(Number.isFinite(time) ? Math.max(0, time) : 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = String(Math.floor(seconds / 60) % 60).padStart(hours ? 2 : 1, '0');
  return `${hours ? `${hours}:` : ''}${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function mediaDuration(media: HTMLMediaElement) {
  return Number.isFinite(media.duration) ? media.duration : 0;
}

export function readBuffered(media: HTMLMediaElement): [number, number][] {
  const ranges = media.buffered;
  return Array.from({ length: ranges.length }, (_, index) => [
    ranges.start(index),
    ranges.end(index),
  ]);
}

export function mediaError(error: MediaError | null) {
  switch (error?.code) {
    case 1:
      return 'Loading was interrupted. Try again.';
    case 2:
      return 'The connection was interrupted. Check your connection and retry.';
    case 3:
      return 'This media could not be decoded. Try another file.';
    case 4:
      return 'This format or media source is not supported.';
    default:
      return 'Unable to load this media. Try again.';
  }
}
