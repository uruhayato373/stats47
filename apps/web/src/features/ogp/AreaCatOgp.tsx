import { BRAND, FONT } from './brand';
import { JapanMapSvg } from './JapanMapSvg';

export interface AreaCatOgpData {
  prefCode: number;
  areaName: string;
  categoryName: string;
  categoryEn?: string | null;
  indicators?: Array<{ rank: number; label: string; value: number; unit?: string }>;
}

interface Props {
  data: AreaCatOgpData;
}

// AreaCatMap A案: 薄い地図(blue highlight) + カテゴリ名 + インジケータグリッド
export function AreaCatOgp({ data }: Props) {
  const indicators = (data.indicators ?? []).slice(0, 4);
  const catEn = data.categoryEn ?? 'CATEGORY';

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        position: 'relative',
        background: '#F8FAFC',
        display: 'flex',
        fontFamily: FONT.sansJP,
        overflow: 'hidden',
      }}
    >
      {/* 背景地図 */}
      <div
        style={{
          position: 'absolute',
          left: 50,
          top: -20,
          width: 1100,
          height: 680,
          opacity: 0.2,
          display: 'flex',
        }}
      >
        <JapanMapSvg
          width={1100}
          height={680}
          baseFill="#CBD5E1"
          highlight={[data.prefCode]}
          highlightColor={BRAND.primary}
          strokeColor="#fff"
          strokeWidth={0.5}
        />
      </div>

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
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '44px 32px',
          boxSizing: 'border-box',
        }}
      >
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              letterSpacing: 4,
              color: BRAND.primary,
              fontWeight: 700,
            }}
          >
            {catEn} · #{String(data.prefCode).padStart(2, '0')}
          </div>
          <div
            style={{
              fontFamily: FONT.sansJP,
              fontSize: 22,
              color: BRAND.muted,
              marginTop: 6,
            }}
          >
            {data.areaName}の
          </div>
          <div
            style={{
              fontFamily: FONT.sansJP,
              fontWeight: 900,
              fontSize: 88,
              color: BRAND.ink,
              lineHeight: 1,
              letterSpacing: -2,
              marginTop: -2,
            }}
          >
            {data.categoryName}
          </div>
        </div>

        {/* インジケータグリッド (2x2) */}
        {indicators.length > 0 && (
          <div
            style={{
              width: '100%',
              background: '#fff',
              padding: 16,
              boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {indicators.map((ind) => {
              const good = ind.rank <= 10;
              const bad = ind.rank >= 40;
              const col = good ? BRAND.success : bad ? BRAND.vermilion : BRAND.ink;
              return (
                <div
                  key={ind.label}
                  style={{
                    width: 'calc(50% - 5px)',
                    padding: '8px 10px',
                    borderLeft: `3px solid ${col}`,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ fontFamily: FONT.mono, fontSize: 10, color: col, fontWeight: 700 }}>
                    #{ind.rank}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT.sansJP,
                      fontSize: 12,
                      fontWeight: 600,
                      color: BRAND.ink,
                      marginTop: 2,
                    }}
                  >
                    {ind.label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 16,
                      fontWeight: 800,
                      color: BRAND.ink,
                      marginTop: 2,
                    }}
                  >
                    {ind.value}
                    <span style={{ fontSize: 9, color: BRAND.muted, marginLeft: 2 }}>
                      {ind.unit ?? ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ロゴ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontWeight: 900, fontSize: 14, color: BRAND.ink, fontFamily: FONT.sansJP }}>
            stats
          </span>
          <span
            style={{
              fontWeight: 900,
              fontSize: 14,
              color: '#fff',
              background: BRAND.primary,
              padding: '1px 5px',
              fontFamily: FONT.sansJP,
            }}
          >
            47
          </span>
        </div>
      </div>
    </div>
  );
}
