import { BRAND, FONT } from './brand';
import { JapanMapSvg } from './JapanMapSvg';

export interface AreaOgpData {
  prefCode: number;
  areaName: string;
  strengths?: Array<{ rank: number; indicator: string }>;
  weaknesses?: Array<{ rank: number; indicator: string }>;
}

interface Props {
  data: AreaOgpData;
}

// AreaMapHighlight A案: 薄い地図(当該県ハイライト) + 強弱グリッド
export function AreaOgp({ data }: Props) {
  const strengths = (data.strengths ?? []).slice(0, 2);
  const weaknesses = (data.weaknesses ?? []).slice(0, 2);

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        position: 'relative',
        background: BRAND.paper,
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
          opacity: 0.18,
          display: 'flex',
        }}
      >
        <JapanMapSvg
          width={1100}
          height={680}
          baseFill="#CBD5E1"
          highlight={[data.prefCode]}
          highlightColor={BRAND.vermilion}
          strokeColor="#fff"
          strokeWidth={0.6}
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
          padding: '46px 32px',
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
              color: BRAND.vermilion,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            AREA #{String(data.prefCode).padStart(2, '0')}
          </div>
        </div>

        {/* 都道府県名 */}
        <div
          style={{
            fontFamily: FONT.sansJP,
            fontWeight: 900,
            fontSize: 110,
            color: BRAND.ink,
            lineHeight: 1,
          }}
        >
          {data.areaName}
        </div>

        {/* 強弱グリッド */}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <div
            style={{
              width: '100%',
              background: '#fff',
              padding: 18,
              display: 'flex',
              gap: 16,
            }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  letterSpacing: 2,
                  color: BRAND.success,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                ▲ STRENGTHS
              </div>
              {strengths.map((s) => (
                <div
                  key={s.indicator}
                  style={{
                    fontFamily: FONT.sansJP,
                    fontSize: 13,
                    paddingBottom: 3,
                    borderBottom: `1px solid ${BRAND.line}`,
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      color: BRAND.success,
                      fontWeight: 700,
                      marginRight: 6,
                      fontSize: 11,
                    }}
                  >
                    #{s.rank}
                  </span>
                  {s.indicator}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  letterSpacing: 2,
                  color: BRAND.vermilion,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                ▼ WEAKNESSES
              </div>
              {weaknesses.map((s) => (
                <div
                  key={s.indicator}
                  style={{
                    fontFamily: FONT.sansJP,
                    fontSize: 13,
                    paddingBottom: 3,
                    borderBottom: `1px solid ${BRAND.line}`,
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      color: BRAND.vermilion,
                      fontWeight: 700,
                      marginRight: 6,
                      fontSize: 11,
                    }}
                  >
                    #{s.rank}
                  </span>
                  {s.indicator}
                </div>
              ))}
            </div>
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
