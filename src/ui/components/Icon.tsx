const PATHS = {
  camera: 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm8 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  image: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm-1 11 5-5 4 4 3-3 6 6M15.5 9.5h.01',
  back: 'M15 5l-7 7 7 7',
  before: 'M15 5l-7 7 7 7',
  after: 'M9 5l7 7-7 7',
  trash: 'M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5',
  share: 'M12 15V4m0 0L8 8m4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6',
  rotate: 'M20 11a8 8 0 1 0-2.3 6.3M20 5v6h-6',
  crop: 'M7 2v15h15M2 7h15v15',
  pen: 'M4 20l1-4L16 5l3 3L8 19l-4 1Zm10-13 3 3',
  text: 'M5 6V4h14v2M12 4v16m-3 0h6',
  card: 'M3 6h18v12H3zM7 10h4v4H7zm7 0h4m-4 4h4',
  merge: 'M4 4h7v7H4zM13 13h7v7h-7zM7.5 11v5.5H13M16.5 13V7.5H11',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12l5 5 9-10',
  undo: 'M9 7 4 12l5 5M4 12h11a5 5 0 0 1 0 10h-3',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 5 5',
  plus: 'M12 5v14M5 12h14',
  gallery: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm-1 11 5-5 4 4 3-3 6 6',
  signature: 'M3 17c3-1 5-8 7-8s0 8 2 8 2-4 4-4 1 3 5 3M3 21h18',
  download: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14',
  menu: 'M12 5h.01M12 12h.01M12 19h.01',
  scan: 'M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M4 12h16',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
