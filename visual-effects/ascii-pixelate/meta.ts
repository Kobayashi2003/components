import type { ComponentMeta } from '../../types';

export default {
  slug: 'ascii-pixelate',
  title: 'ASCII Pixelate',
  category: 'visual-effects',
  kind: 'effect',
  status: 'experimental',
  summary:
    'Turns images, canvases, and live video into ASCII with a denser focus field that follows the pointer.',
  usage: 'reusable',
  capabilities: { reducedMotion: true, touch: 'limited' },
  tags: ['pointer-hover', 'canvas-2d', 'ascii-art'],
} satisfies ComponentMeta;
