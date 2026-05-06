import { BRAND, FONT } from './brand';
import { JapanMapSvg } from './JapanMapSvg';

export interface RankingOgpData {
  title: string;
  unit: string;
  source: string;
  top3: Array<{ rank: number; name: string; value: number }>;
  last?: { rank: number; name: string; value: number } | null;
}

interface Props {
  data: RankingOgpData;
}

// RankingChoropleth A案: 薄い地図背景 + TOP3カード + BOTTOMカード
export function RankingOgp({ data }: Props) {
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
          left: 100,
          top: -40,
          width: 1000,
          height: 700,
          opacity: 0.25,
          display: 'flex',
        }}
      >
        <JapanMapSvg
          width={1000}
          height={700}
          baseFill="#CBD5E1"
          valueFn={(code) => ((code * 11) % 47) / 47}
          palette={['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#1D4ED8']}
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
          padding: '46px 36px',
          boxSizing: 'border-box',
        }}
      >
        {/* タイトル */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              letterSpacing: 4,
              color: BRAND.primary,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            RANKING · 47 PREFECTURES
          </div>
          <div
            style={{
              fontFamily: FONT.sansJP,
              fontWeight: 900,
              fontSize: 40,
              color: BRAND.ink,
              lineHeight: 1.15,
            }}
          >
            {data.title}
          </div>
          <div
            style={{
              fontFamily: FONT.sansJP,
              fontSize: 14,
              color: BRAND.muted,
              marginTop: 6,
            }}
          >
            ランキング（{data.unit}）
          </div>
        </div>

        {/* TOP3 */}
        <div
          style={{
            background: '#fff',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: 3,
              color: BRAND.success,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            ▲ TOP 3
          </div>
          {data.top3.map((p, i) => (
            <div
              key={p.rank}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                padding: '6px 0',
                borderBottom: i < 2 ? `1px solid ${BRAND.line}` : 'none',
              }}
            >
              <span
                style={{
                  fontFamily: FONT.display,
                  fontSize: 28,
                  fontWeight: 900,
                  color: BRAND.ink,
                  minWidth: 48,
                }}
              >
                #{p.rank}
              </span>
              <span
                style={{
                  fontFamily: FONT.sansJP,
                  fontSize: 18,
                  fontWeight: 700,
                  color: BRAND.ink,
                  flex: 1,
                }}
              >
                {p.name}
              </span>
              <span
                style={{ fontFamily: FONT.mono, fontSize: 20, fontWeight: 800, color: BRAND.ink }}
              >
                {p.value}
                <span style={{ fontSize: 11, color: BRAND.muted, marginLeft: 2 }}>{data.unit}</span>
              </span>
            </div>
          ))}
        </div>

        {/* BOTTOM */}
        {data.last && (
          <div
            style={{
              background: '#fff',
              padding: '14px 22px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: 3,
                color: BRAND.vermilion,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              ▼ BOTTOM
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span
                style={{
                  fontFamily: FONT.display,
                  fontSize: 20,
                  fontWeight: 900,
                  color: BRAND.vermilion,
                  minWidth: 48,
                }}
              >
                #{data.last.rank}
              </span>
              <span
                style={{
                  fontFamily: FONT.sansJP,
                  fontSize: 15,
                  fontWeight: 700,
                  color: BRAND.ink,
                  flex: 1,
                }}
              >
                {data.last.name}
              </span>
              <span
                style={{ fontFamily: FONT.mono, fontSize: 17, fontWeight: 800, color: BRAND.vermilion }}
              >
                {data.last.value}
              </span>
            </div>
          </div>
        )}

        {/* フッター */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{ fontWeight: 900, fontSize: 14, color: BRAND.ink, fontFamily: FONT.sansJP }}
            >
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
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              color: BRAND.muted,
              letterSpacing: 2,
            }}
          >
            {data.source}
          </span>
        </div>
      </div>
    </div>
  );
}
