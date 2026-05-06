import { BRAND, FONT } from './brand';

// TopMinimal A案: 47ドット背景 + 中央 stats47 ロゴ
export function DefaultOgp() {
  const dots: Array<{ key: string; cx: number; cy: number; fill: string; opacity: number }> = [];
  for (let r = 0; r < 18; r++) {
    for (let c = 0; c < 36; c++) {
      const idx = r * 36 + c;
      dots.push({
        key: `${r}-${c}`,
        cx: 20 + c * 33,
        cy: 18 + r * 35,
        fill: idx % 13 === 0 ? BRAND.vermilion : idx % 7 === 0 ? BRAND.primary : BRAND.line,
        opacity: c < 9 || c > 26 ? 0.7 : 0.35,
      });
    }
  }

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        position: 'relative',
        background: BRAND.paper,
        display: 'flex',
        fontFamily: FONT.sansJP,
      }}
    >
      {/* 背景ドット */}
      <svg
        width={1200}
        height={630}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {dots.map((d) => (
          <circle key={d.key} cx={d.cx} cy={d.cy} r={3} fill={d.fill} opacity={d.opacity} />
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
          background: 'rgba(248,250,252,0.95)',
          display: 'flex',
        }}
      />

      {/* コンテンツ */}
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
            marginBottom: 16,
          }}
        >
          47 PREFECTURES · DATA
        </div>

        <div
          style={{
            fontFamily: FONT.display,
            fontSize: 160,
            fontWeight: 900,
            color: BRAND.ink,
            lineHeight: 0.9,
            letterSpacing: -8,
            display: 'flex',
          }}
        >
          <span style={{ color: BRAND.primary }}>stats</span>
          <span>47</span>
        </div>

        <div
          style={{
            width: 80,
            height: 3,
            background: BRAND.vermilion,
            marginTop: 22,
            marginBottom: 22,
          }}
        />

        <div
          style={{
            fontFamily: FONT.sansJP,
            fontSize: 26,
            fontWeight: 700,
            color: BRAND.ink,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          47都道府県をデータで読み解く
        </div>

        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 12,
            color: BRAND.muted,
            letterSpacing: 3,
            marginTop: 24,
          }}
        >
          stats47.jp
        </div>
      </div>
    </div>
  );
}
