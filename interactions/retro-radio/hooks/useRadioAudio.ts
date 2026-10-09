import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface UseRadioAudioOptions {
  /** 0–100, applied through the Web Audio gain node. */
  volume: number;
  spectrumCanvasRef: RefObject<HTMLCanvasElement | null>;
  onPlaybackChange?: (playing: boolean) => void;
  /** The loaded track played to its end. */
  onEnded?: () => void;
}

/**
 * Local-file playback for the radio: one audio element routed through an
 * analyser (for the CRT spectrum) and a gain node (for the volume dial). The
 * graph is created on the first load because an AudioContext needs a gesture.
 */
export function useRadioAudio({
  volume,
  spectrumCanvasRef,
  onPlaybackChange,
  onEnded,
}: UseRadioAudioOptions) {
  const [playing, setPlaying] = useState(false);
  const [musicName, setMusicName] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const spectrumFrameRef = useRef(0);
  const spectrumDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const playingRef = useRef(false);
  const volumeRef = useRef(volume);
  const callbacksRef = useRef({ onPlaybackChange, onEnded });

  useEffect(() => {
    callbacksRef.current = { onPlaybackChange, onEnded };
  }, [onPlaybackChange, onEnded]);

  useEffect(() => {
    volumeRef.current = volume;
    if (gainRef.current) gainRef.current.gain.value = volume / 100;
  }, [volume]);

  // The analyser data is painted straight to the canvas; keeping it outside
  // React avoids a render for every animation frame.
  const drawSpectrum = useCallback(
    function drawSpectrumFrame() {
      const analyser = analyserRef.current;
      const canvas = spectrumCanvasRef.current;
      const context = canvas?.getContext('2d');

      // Stop instead of idling: a paused analyser only returns zeros, and the
      // loop would otherwise stay resident for the page's lifetime.
      if (!playingRef.current || !analyser || !canvas || !context) {
        if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
        spectrumFrameRef.current = 0;
        return;
      }

      spectrumDataRef.current ??= new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      const frequencyData = spectrumDataRef.current;
      analyser.getByteFrequencyData(frequencyData);
      context.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / frequencyData.length;
      context.fillStyle = '#9dffb0';
      frequencyData.forEach((level, index) => {
        const barHeight = (level / 255) * canvas.height;
        context.fillRect(
          index * barWidth + 1,
          canvas.height - barHeight,
          Math.max(1, barWidth - 2),
          barHeight,
        );
      });

      spectrumFrameRef.current = window.requestAnimationFrame(drawSpectrumFrame);
    },
    [spectrumCanvasRef],
  );

  const setPlaybackState = useCallback(
    (nextPlaying: boolean) => {
      playingRef.current = nextPlaying;
      setPlaying(nextPlaying);
      callbacksRef.current.onPlaybackChange?.(nextPlaying);
      if (nextPlaying && !spectrumFrameRef.current) drawSpectrum();
    },
    [drawSpectrum],
  );

  const ensureAudioGraph = useCallback(() => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.preload = 'metadata';
      audio.addEventListener('ended', () => {
        setPlaybackState(false);
        callbacksRef.current.onEnded?.();
      });
      // Pauses from outside the radio (system media keys, other players) update the screen too.
      const element = audio;
      audio.addEventListener('pause', () => {
        if (playingRef.current && !element.ended) setPlaybackState(false);
      });
      audioRef.current = audio;
    }

    let audioContext = audioContextRef.current;
    if (!audioContext) {
      audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const gain = audioContext.createGain();
      const source = audioContext.createMediaElementSource(audio);

      analyser.fftSize = 64;
      gain.gain.value = volumeRef.current / 100;
      source.connect(analyser);
      analyser.connect(gain);
      gain.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      gainRef.current = gain;
    }

    return { audio, audioContext };
  }, [setPlaybackState]);

  /** Replace the track and start it. Resolves to whether playback started. */
  const load = useCallback(
    async (file: File) => {
      const { audio, audioContext } = ensureAudioGraph();

      audio.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);

      const nextUrl = URL.createObjectURL(file);
      audioUrlRef.current = nextUrl;
      audio.src = nextUrl;
      audio.load();
      setMusicName(file.name.replace(/\.[^.]+$/, '') || file.name);

      try {
        await audioContext.resume();
        await audio.play();
        setPlaybackState(true);
        return true;
      } catch {
        setPlaybackState(false);
        return false;
      }
    },
    [ensureAudioGraph, setPlaybackState],
  );

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingRef.current) {
      audio.pause();
      setPlaybackState(false);
      return;
    }

    try {
      await audioContextRef.current?.resume();
      await audio.play();
      setPlaybackState(true);
    } catch {
      setPlaybackState(false);
    }
  }, [setPlaybackState]);

  /** Read at call time, for timers that outlive the render that set them. */
  const isPlaying = useCallback(() => playingRef.current, []);

  useEffect(
    () => () => {
      window.cancelAnimationFrame(spectrumFrameRef.current);
      const audio = audioRef.current;
      audio?.pause();
      audio?.removeAttribute('src');
      audio?.load();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      void audioContextRef.current?.close();
    },
    [],
  );

  return { playing, musicName, isPlaying, load, toggle };
}
