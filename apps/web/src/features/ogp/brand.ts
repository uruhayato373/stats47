export const BRAND = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  secondary: '#38BDF8',
  success: '#10B981',
  ink: '#0F172A',
  muted: '#475569',
  mutedLight: '#94A3B8',
  line: '#CBD5E1',
  wash: '#E2E8F0',
  paper: '#F8FAFC',
  white: '#FFFFFF',
  vermilion: '#E63946',
} as const;

export const OGP_SURFACE = {
  whiteOverlay: 'rgba(255,255,255,0.85)',
  paperOverlay: 'rgba(248,250,252,0.92)',
} as const;

export const OGP_SHADOW = {
  centerPanel: '0 0 40px rgba(15,23,42,0.08)',
  raisedCard: '0 10px 32px rgba(15,23,42,0.10)',
  softCard: '0 8px 28px rgba(15,23,42,0.1)',
  subtleCard: '0 6px 20px rgba(15,23,42,0.06)',
} as const;

const OGP_MAP_BLUE_PALETTE: string[] = [
  '#EFF6FF',
  '#DBEAFE',
  '#BFDBFE',
  '#93C5FD',
  '#60A5FA',
  '#3B82F6',
  '#1D4ED8',
];

export const OGP_MAP = {
  baseFill: BRAND.line,
  stroke: BRAND.white,
  bluePalette: OGP_MAP_BLUE_PALETTE,
} as const;

export const FONT = {
  sansJP: '"Noto Sans JP", sans-serif',
  mono: '"JetBrains Mono", monospace',
  display: '"Archivo Black", sans-serif',
} as const;
