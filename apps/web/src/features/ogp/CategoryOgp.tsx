import { BRAND, FONT } from './brand';

export interface CategoryOgpData {
  title: string;
  titleEn?: string | null;
  indicatorCount?: number | null;
}

interface Props {
  data: CategoryOgpData;
}

// CategoryTextHero A案: ドット背景 + 超大判カテゴリ名
export function CategoryOgp({ data }: Props) {
  const titleEn = data.titleEn ?? 'CATEGORY';
  const indicatorCount = data.indicatorCount ?? 0;

  const dots: Array<{ key: string; cx: number; cy: number; fill: string }> = [];
  for (let r = 0; r < 18; r++) {
    for (let c = 0; c < 36; c++) {
      dots.push({
        key: `${r}-${c}`,
        cx: 20 + c * 33,
        cy: 18 + r * 35,
        fill: (r + c) % 9 === 0 ? BRAND.primary : BRAND.line,
      });
    }
  }

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        position: 'relative',
        background: '#FFFFFF',
        display: 'flex',
        fontFamily: FONT.sansJP,
        overflow: 'hidden',
      }}
    >
      {/* ドット背景 */}
      <svg
        width={1200}
        height={630}
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0.4 }}
      >
        {dots.map((d) => (
          <circle key={d.key} cx={d.cx} cy={d.cy} r={2} fill={d.fill} />
        ))}
      </svg>

      {/* 中央パネル */}
      <div
        style={{
          position: 'absolute',
          left: 285,
          top: 0,
          width: 630,
          height: 630,
          background: 'rgba(255,255,255,0.88)',
          display: 'flex',
        }}
      />

      {/* セーフゾーン */}
      <div
        style={{
          position: 'absolute',
          left: 285,
          top: 0,
          width: 630,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 12,
            letterSpacing: 5,
            color: BRAND.primary,
            fontWeight: 700,
            marginBottom: 20,
          }}
        >
          CATEGORY / {titleEn}
        </div>

        <div
          style={{
            fontFamily: FONT.sansJP,
            fontWeight: 900,
            fontSize: 200,
            color: BRAND.ink,
            lineHeight: 0.9,
          }}
        >
          {data.title}
        </div>

        <div
          style={{
            width: 80,
            height: 3,
            background: BRAND.primary,
            marginTop: 24,
            marginBottom: 24,
          }}
        />

        <div style={{ fontFamily: FONT.sansJP, fontSize: 20, color: BRAND.muted, display: 'flex', alignItems: 'baseline', gap: 4 }}>
          {indicatorCount > 0 && (
            <>
              <span
                style={{ color: BRAND.primary, fontWeight: 900, fontSize: 26 }}
              >
                {indicatorCount}
              </span>
              <span>指標 × </span>
            </>
          )}
          <span style={{ color: BRAND.primary, fontWeight: 900, fontSize: 26 }}>47</span>
          <span>都道府県</span>
        </div>
      </div>
    </div>
  );
}
