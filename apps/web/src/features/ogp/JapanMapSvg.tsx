import { BRAND } from './brand';

const PREF_DATA: Array<{ code: number; pts: string }> = [
  { code: 1, pts: '68,3 92,6 96,14 92,24 82,26 70,22 66,14 68,8' },
  { code: 2, pts: '72,28 84,28 86,34 78,38 70,34' },
  { code: 3, pts: '76,36 86,36 88,46 80,48 74,44' },
  { code: 4, pts: '70,44 80,44 82,50 74,52 68,48' },
  { code: 5, pts: '66,34 76,34 76,42 68,44 64,40' },
  { code: 6, pts: '64,42 74,42 74,50 66,52 62,46' },
  { code: 7, pts: '66,48 78,48 80,56 70,58 64,54' },
  { code: 8, pts: '70,55 78,55 80,62 72,64 68,60' },
  { code: 9, pts: '66,53 72,53 74,60 68,61 64,57' },
  { code: 10, pts: '62,54 70,54 70,61 64,63 60,58' },
  { code: 11, pts: '64,60 72,60 72,64 66,66 62,63' },
  { code: 12, pts: '72,61 78,61 80,67 74,70 72,66' },
  { code: 13, pts: '67,63 73,63 73,66 68,67 66,64' },
  { code: 14, pts: '65,65 72,65 73,69 67,70 64,67' },
  { code: 15, pts: '58,44 68,44 70,54 62,56 56,50' },
  { code: 16, pts: '54,51 62,51 62,56 56,58 52,55' },
  { code: 17, pts: '50,48 56,48 56,56 52,58 48,52' },
  { code: 18, pts: '48,55 56,55 56,60 50,62 46,58' },
  { code: 19, pts: '62,62 68,62 68,66 64,67 60,64' },
  { code: 20, pts: '58,54 66,54 66,63 60,64 56,60' },
  { code: 21, pts: '54,56 62,56 62,62 56,64 52,60' },
  { code: 22, pts: '58,64 68,64 70,70 62,72 56,68' },
  { code: 23, pts: '56,63 64,63 64,68 58,70 54,66' },
  { code: 24, pts: '52,64 60,64 60,72 54,74 50,68' },
  { code: 25, pts: '48,59 56,59 56,65 50,66 46,62' },
  { code: 26, pts: '44,57 52,57 52,66 46,66 42,62' },
  { code: 27, pts: '42,64 50,64 50,70 44,71 40,67' },
  { code: 28, pts: '36,56 48,56 48,66 40,68 34,62' },
  { code: 29, pts: '44,66 52,66 52,72 46,73 42,69' },
  { code: 30, pts: '42,70 50,70 50,76 44,78 40,73' },
  { code: 31, pts: '32,57 42,57 42,62 36,63 30,60' },
  { code: 32, pts: '26,59 36,59 36,64 30,66 24,62' },
  { code: 33, pts: '34,62 42,62 42,68 36,69 32,65' },
  { code: 34, pts: '28,63 36,63 36,69 30,70 26,66' },
  { code: 35, pts: '22,65 30,65 30,71 24,72 18,68' },
  { code: 36, pts: '36,70 44,70 44,75 38,76 34,72' },
  { code: 37, pts: '34,68 42,68 42,71 36,72 32,70' },
  { code: 38, pts: '28,69 38,69 38,75 32,76 26,72' },
  { code: 39, pts: '28,73 40,73 40,78 32,80 26,76' },
  { code: 40, pts: '16,67 24,67 24,73 18,74 14,70' },
  { code: 41, pts: '12,70 20,70 20,74 14,75 10,72' },
  { code: 42, pts: '8,70 16,70 16,78 10,80 6,74' },
  { code: 43, pts: '14,73 22,73 22,80 16,81 12,76' },
  { code: 44, pts: '18,71 26,71 26,77 20,78 16,74' },
  { code: 45, pts: '18,77 26,77 26,85 20,86 16,81' },
  { code: 46, pts: '14,80 22,80 22,90 16,91 12,84' },
  { code: 47, pts: '4,92 12,92 12,96 6,97 2,94' },
];

interface JapanMapSvgProps {
  width?: number;
  height?: number;
  valueFn?: (code: number) => number;
  highlight?: number[];
  palette?: string[];
  strokeColor?: string;
  strokeWidth?: number;
  baseFill?: string;
  highlightColor?: string | null;
}

export function JapanMapSvg({
  width = 500,
  height = 500,
  valueFn,
  highlight = [],
  palette = ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#1D4ED8'],
  strokeColor = '#fff',
  strokeWidth = 1,
  baseFill = '#E2E8F0',
  highlightColor = null,
}: JapanMapSvgProps) {
  const lerp = (v: number): string => {
    if (v <= 0) return palette[0];
    if (v >= 1) return palette[palette.length - 1];
    return palette[Math.floor(v * (palette.length - 1))];
  };

  return (
    <svg width={width} height={height} viewBox="0 0 100 100">
      {PREF_DATA.map((p) => {
        let fill = baseFill;
        if (valueFn) fill = lerp(valueFn(p.code));
        if (highlight.includes(p.code)) fill = highlightColor ?? BRAND.vermilion;
        return (
          <polygon
            key={p.code}
            points={p.pts}
            fill={fill}
            stroke={strokeColor}
            stroke-width={String(strokeWidth)}
            stroke-linejoin="round"
          />
        );
      })}
    </svg>
  );
}
