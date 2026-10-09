import { useEffect, useState } from 'react';

export function readPreference<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

export function writePreference(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Playback does not require storage access. */
  }
}

export function useMediaPreferences(key: string) {
  const [preferences, setPreferences] = useState(() => {
    const value = readPreference<Partial<{ volume: number; muted: boolean; rate: number }>>(
      key,
      {},
    );
    return {
      volume:
        typeof value.volume === 'number' && Number.isFinite(value.volume)
          ? Math.min(1, Math.max(0, value.volume))
          : 1,
      muted: value.muted === true,
      rate:
        typeof value.rate === 'number' && [0.5, 0.75, 1, 1.25, 1.5, 2].includes(value.rate)
          ? value.rate
          : 1,
    };
  });
  useEffect(() => writePreference(key, preferences), [key, preferences]);
  return [preferences, setPreferences] as const;
}
