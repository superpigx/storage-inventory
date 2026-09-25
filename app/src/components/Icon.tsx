import type { CSSProperties } from 'react';

export type IconName =
  | 'search'
  | 'plus'
  | 'home'
  | 'room'
  | 'cabinet'
  | 'bag'
  | 'pin'
  | 'chevron-down'
  | 'chevron-right'
  | 'edit'
  | 'trash'
  | 'camera'
  | 'check'
  | 'arrow-left'
  | 'layers'
  | 'filter'
  | 'x'
  | 'grid'
  | 'list'
  | 'inbox';

// 统一 24x24 描边图标（Feather 风格），currentColor 随主题着色
const PATHS: Record<IconName, string[]> = {
  search: ['M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0', 'M21 21l-4.35 -4.35'],
  plus: ['M12 5v14', 'M5 12h14'],
  home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V20h14V9.5', 'M9.5 20v-6h5v6'],
  room: ['M3 8l9-5 9 5v8l-9 5-9-5z', 'M3 8l9 5 9-5', 'M12 13v8'],
  cabinet: ['M4 5h16v14H4z', 'M4 12h16', 'M12 5v14', 'M7.5 8.5v0.01', 'M7.5 15.5v0.01'],
  bag: ['M6 7h12l1 13H5z', 'M9 7V5a3 3 0 0 1 6 0v2'],
  pin: [
    'M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z',
    'M12 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3'
  ],
  'chevron-down': ['M6 9l6 6 6-6'],
  'chevron-right': ['M9 6l6 6-6 6'],
  edit: ['M4 20h4L20 8l-4-4L4 16v4z', 'M13.5 6.5l4 4'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13'],
  camera: [
    'M4 8h3l2-3h6l2 3h3v11H4z',
    'M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z'
  ],
  check: ['M5 12l5 5 9-11'],
  'arrow-left': ['M19 12H5', 'M12 5l-7 7 7 7'],
  layers: ['M12 3l9 5-9 5-9-5 9-5z', 'M3 13l9 5 9-5'],
  filter: ['M4 5h16l-6 7v6l-4 2v-8z'],
  x: ['M6 6l12 12', 'M18 6L6 18'],
  grid: [
    'M4 4h7v7H4z',
    'M13 4h7v7h-7z',
    'M4 13h7v7H4z',
    'M13 13h7v7h-7z'
  ],
  list: ['M8 6h12', 'M8 12h12', 'M8 18h12', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'],
  inbox: ['M4 13l3-8h10l3 8', 'M4 13h4l1.5 3h5L16 13h4v6H4z']
};

export default function Icon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.8
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 } as CSSProperties}
    >
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
