import type { ComponentMeta } from '../../types';

export default {
  slug: 'ascii-glitch',
  title: 'ASCII Glitch',
  category: 'visual-effects',
  kind: 'effect',
  status: 'experimental',
  summary:
    'A terminal-style text glitch with character swaps, horizontal tears, scanlines, and flicker.',
  usage: 'reusable',
  capabilities: { reducedMotion: true, touch: 'supported' },
  tags: ['ascii-art', 'typography', 'signal-damage'],
} satisfies ComponentMeta;
