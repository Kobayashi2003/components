export type ControlIconName =
  | 'plus'
  | 'close'
  | 'check'
  | 'arrow'
  | 'send'
  | 'search'
  | 'home'
  | 'folder'
  | 'bookmark'
  | 'user'
  | 'bell'
  | 'trash'
  | 'undo'
  | 'chevron'
  | 'document'
  | 'table'
  | 'board'
  | 'frame'
  | 'text'
  | 'shape'
  | 'pen'
  | 'star'
  | 'wave';

const paths: Record<ControlIconName, string> = {
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M18 6 6 18',
  check: 'm5 12 4 4L19 6',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  send: 'M12 19V5m-6 6 6-6 6 6',
  search: 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  home: 'm3 10 9-7 9 7v10H3Zm6 10v-7h6v7',
  folder: 'M3 5h6l2 3h10v12H3Z',
  bookmark: 'M6 3h12v18l-6-4-6 4Z',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 5 0 0 1 16 0v2',
  bell: 'M5 9a7 7 0 0 1 14 0c0 7 2 7 2 9H3c0-2 2-2 2-9m5 12h4',
  trash: 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',
  undo: 'M8 4 3 9l5 5M3 9h11a6 6 0 0 1 0 12',
  chevron: 'm7 9 5 5 5-5',
  document: 'M5 3h9l5 5v13H5Zm9 0v5h5M8 12h8m-8 4h8',
  table: 'M3 3h18v18H3Zm0 6h18M9 3v18',
  board: 'M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z',
  frame: 'M7 2v20M17 2v20M2 7h20M2 17h20',
  text: 'M4 5V3h16v2M12 3v18M8 21h8',
  shape: 'M5 4h14v16H5Z',
  pen: 'm3 3 14 4 4 10-7 4-9-9Zm0 0 9 9m3 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z',
  wave: 'M4 10v4m4-7v10m4-14v18m4-15v12m4-8v4',
};

export function ControlIcon({ name, size = 20 }: { name: ControlIconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
