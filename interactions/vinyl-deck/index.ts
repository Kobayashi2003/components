import './styles.css';
export { VinylDeck, FocusDeck } from './VinylDeck';
export { VinylTurntable } from './components/VinylTurntable';
export { VinylDeckBackground } from './components/VinylDeckBackground';
export type { VinylTurntableProps, VinylDeckItem } from './components/VinylTurntable';
export type { VinylDeckBackgroundProps } from './components/VinylDeckBackground';
export type { VinylDeckProps, FocusDeckItem, FocusDeckProps } from './VinylDeck';
export type {
  VinylDeckAudioSnapshot,
  VinylDeckAudioSource,
  FocusDeckAudioSnapshot,
  FocusDeckAudioSource,
} from './hooks/useVinylDeckAudio';
