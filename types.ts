import type { TagId } from './tags';

export type EntryKind = 'component' | 'effect' | 'experiment';
export type EntryStatus = 'stable' | 'experimental' | 'draft';

export interface CompatibilityNotice {
  message: string;
}

/** The default export of every `<category>/<slug>/meta.ts`. */
export interface ComponentMeta {
  slug: string;
  title: string;
  /** The name of the category directory the entry lives in. */
  category: string;
  kind: EntryKind;
  status: EntryStatus;
  summary: string;
  usage: 'reusable' | 'showcase';
  capabilities?: {
    touch?: 'supported' | 'limited' | 'unsupported';
    keyboard?: boolean;
    reducedMotion?: boolean;
  };
  hideDocumentation?: boolean;
  tags: TagId[];
  compatibility?: CompatibilityNotice;
}
