import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

// ── Brand / cover
export const IconBank = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M3 9.5 12 4l9 5.5" />
    <path d="M5 10v8.5M9.5 10v8.5M14.5 10v8.5M19 10v8.5" />
    <path d="M3.5 20h17" />
    <circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
export const IconSparkle = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z" />
    <path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z" />
  </svg>
);

// ── Action
export const IconPlus = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconDownload = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M12 4v11" /><path d="m7 10 5 5 5-5" /><path d="M5 19h14" /></svg>
);
export const IconClose = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconRefresh = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M3.5 12a8.5 8.5 0 0 1 14.5-6L20 8" />
    <path d="M20 4v4h-4" />
    <path d="M20.5 12a8.5 8.5 0 0 1-14.5 6L4 16" />
    <path d="M4 20v-4h4" />
  </svg>
);
export const IconSearch = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.6-3.6" />
  </svg>
);
export const IconFilter = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M4 6h16M7 12h10M10 18h4" />
    <circle cx="10" cy="18" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="14" cy="6" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);
export const IconSliders = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M4 6h7M14 6h6" />
    <path d="M4 12h3M10 12h10" />
    <path d="M4 18h11M18 18h2" />
    <circle cx="12.5" cy="6" r="1.7" fill="white" />
    <circle cx="8.5" cy="12" r="1.7" fill="white" />
    <circle cx="16.5" cy="18" r="1.7" fill="white" />
  </svg>
);

// ── Sort / arrow
export const IconChevronLeft = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="m14 6-6 6 6 6" /></svg>
);
export const IconChevronRight = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="m10 6 6 6-6 6" /></svg>
);
export const IconSortAsc = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M5 16V6M3 8l2-2 2 2" /><path d="M11 10h10M11 14h7M11 18h4" /></svg>
);
export const IconSortDesc = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M5 8v10M3 16l2 2 2-2" /><path d="M11 10h10M11 14h7M11 18h4" /></svg>
);
export const IconSort = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M7 4v16M4 7l3-3 3 3" /><path d="M14 8h6M14 12h4M14 16h6" /></svg>
);

// ── CRUD
export const IconEye = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);
export const IconPencil = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M14.5 4.5 19.5 9.5 8 21H3v-5z" />
    <path d="m13 6 5 5" />
  </svg>
);
export const IconTrash = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);
export const IconCopy = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <rect x="8" y="3" width="13" height="13" rx="2" />
    <path d="M16 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
  </svg>
);
export const IconPin = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z" />
    <path d="M12 14v7" />
  </svg>
);

// ── Usage / land
export const IconHome = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M3 11 12 3l9 8" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </svg>
);
export const IconBuilding = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M4 21V5l8-2v18" />
    <path d="M12 8h8v13" />
    <path d="M7 8h2M7 12h2M7 16h2" />
    <path d="M15 11h2M15 15h2" />
    <path d="M4 21h16" />
  </svg>
);
export const IconLayers = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 13 9 5 9-5" />
    <path d="m3 17 9 5 9-5" />
  </svg>
);
export const IconBriefcase = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 13h18" />
  </svg>
);
export const IconTree = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3l-4 5h2.5L8 13h2.5L7 18h10l-3.5-5H16l-2.5-5H16z" />
    <path d="M12 18v3" />
  </svg>
);
export const IconTruck = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M3 6h11v11H3z" />
    <path d="M14 9h4l3 3v5h-7" />
    <circle cx="7" cy="18.5" r="1.7" />
    <circle cx="17" cy="18.5" r="1.7" />
  </svg>
);
export const IconFile = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M14 3v5h5" />
  </svg>
);

// ── Status
export const IconCheck = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="m4 12 5 5 11-12" /></svg>
);
export const IconHammer = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="m11 6 7 7-3 3-7-7z" />
    <path d="m9 8-6 6 3 3 6-6" />
    <path d="m14 4 6 6" />
  </svg>
);
export const IconArchive = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v12h14V8" />
    <path d="M10 12h4" />
  </svg>
);
export const IconActivity = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M3 12h4l3-8 4 16 3-8h4" />
  </svg>
);

// ── Money / metrics
export const IconCoin = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9h5a2 2 0 0 1 0 4h-5" />
    <path d="M9 13h6a2 2 0 0 1 0 4H9" />
  </svg>
);
export const IconTrending = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="m3 17 6-6 4 4 8-9" />
    <path d="M14 6h7v7" />
  </svg>
);
export const IconDollar = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3v18" />
    <path d="M16 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H8" />
  </svg>
);

// ── View modes
export const IconList = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);
export const IconGrid = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.2" />
    <rect x="14" y="3" width="7" height="7" rx="1.2" />
    <rect x="3" y="14" width="7" height="7" rx="1.2" />
    <rect x="14" y="14" width="7" height="7" rx="1.2" />
  </svg>
);
export const IconMap = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z" />
    <path d="M9 3v16M15 5v16" />
  </svg>
);

// ── Field
export const IconLocation = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M12 21s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);
export const IconCalendar = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
);
export const IconRuler = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="m2 14 8-8 8 8-8 8z" />
    <path d="m6 10 2 2M9 7l2 2M12 10l2 2M15 13l2 2" />
  </svg>
);
export const IconFolder = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);
