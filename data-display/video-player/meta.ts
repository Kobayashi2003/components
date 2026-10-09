import type { ComponentMeta } from '../../types';

export default {
  slug: 'video-player',
  title: 'Video Player',
  category: 'data-display',
  kind: 'component',
  status: 'experimental',
  summary:
    'A reusable video player with chapters, subtitles, gestures, speed, and fullscreen controls.',
  usage: 'reusable',
  capabilities: { touch: 'supported', keyboard: true, reducedMotion: true },
  tags: ['responsive-layout', 'status-feedback', 'semantic-states'],
} satisfies ComponentMeta;
