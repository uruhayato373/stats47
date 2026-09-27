import { BRAND, FONT, OGP_MAP, OGP_SHADOW } from './brand';
import { JapanMapSvg } from './JapanMapSvg';

import type { AreaHighlights } from '@stats47/area-profile';

/**
 * 県 OGP のデータ。「特徴」は selectAreaHighlights の結果をそのまま渡す (件数は呼び出し側が選定時に指定し、
 * ここで切り出さない)。2026-07 以降の県 OGP 画像はシルエットカード (scripts/lib/pref-silhouette-render.ts) で、
 * この部品は現在どの生成経路からも使われていない。再利用時も県の profile.json は読まない (AREA-HIGHLIGHTS-SSOT-01)。
 */
export interface AreaOgpData {
  prefCode: number;
  areaName: string;
  reading?: string | null;
  highlights?: AreaHighlights;
}

/** 良否の色は極性が確定した指標だけ (tone は選定関数が METRIC_POLARITY から決める)。 */
const TONE_COLOR = {
  positive: BRAND.success,
  negative: BRAND.vermilion,
  neutral: BRAND.ink,
} as const;

interface Props {
  data: AreaOgpData;
}

// AreaMapHighlight A案: 薄い地図(当該県ハイライト) + 強弱グリッド
export function AreaOgp({ data }: Props) {
  const topItems = data.highlights?.top ?? [];
  const bottomItems = data.highlights?.bottom ?? [];

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
          baseFill={OGP_MAP.baseFill}
          highlight={[data.prefCode]}
          highlightColor={BRAND.vermilion}
          strokeColor={OGP_MAP.stroke}
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
            {`AREA #${String(data.prefCode).padStart(2, '0')}`}
          </div>
          {data.reading && (
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 13,
                color: BRAND.muted,
                letterSpacing: 6,
              }}
            >
              {data.reading}
            </div>
          )}
        </div>

        {/* 都道府県名 */}
        <div
          style={{
            fontFamily: FONT.sansJP,
            fontWeight: 900,
            fontSize: 140,
            color: BRAND.ink,
            lineHeight: 1,
            letterSpacing: -3,
          }}
        >
          {data.areaName}
        </div>

        {/* 強弱グリッド */}
        {(topItems.length > 0 || bottomItems.length > 0) && (
          <div
            style={{
              width: '100%',
              background: BRAND.white,
              padding: 18,
              boxShadow: OGP_SHADOW.softCard,
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
                  color: BRAND.muted,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                ▲ 全国上位
              </div>
              {topItems.map((s) => (
                <div
                  key={s.rankingKey}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    fontFamily: FONT.sansJP,
                    fontSize: 13,
                    paddingBottom: 3,
                    borderBottom: `1px dashed ${BRAND.line}`,
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      color: TONE_COLOR[s.tone],
                      fontWeight: 700,
                      marginRight: 6,
                      fontSize: 11,
                    }}
                  >
                    {`#${s.rank}`}
                  </span>
                  {s.label}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  letterSpacing: 2,
                  color: BRAND.muted,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                ▼ 全国下位
              </div>
              {bottomItems.map((s) => (
                <div
                  key={s.rankingKey}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    fontFamily: FONT.sansJP,
                    fontSize: 13,
                    paddingBottom: 3,
                    borderBottom: `1px dashed ${BRAND.line}`,
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      color: TONE_COLOR[s.tone],
                      fontWeight: 700,
                      marginRight: 6,
                      fontSize: 11,
                    }}
                  >
                    {`#${s.rank}`}
                  </span>
                  {s.label}
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
              color: BRAND.white,
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
