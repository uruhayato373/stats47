import { BRAND, FONT, OGP_PRODUCT_SCRIM } from './brand';

export interface ProductOgpData {
  channelLabel: string;
  /** 呼出元 (scripts/lib/product-ogp-render.ts) が事前に2行以内へ分割したタイトル。 */
  titleLines: readonly string[];
  titleFontSize: number;
  priceYen: number;
  /** 表紙 (kindle) またはブランド背景の data URI (JPEG)。 */
  backgroundImage: string;
}

interface Props {
  data: ProductOgpData;
}

// ProductStorefrontCard: 全面背景 (表紙/ブランド) + 左60%可読性スクリーン + チャンネル/タイトル/価格/ブランド
export function ProductOgp({ data }: Props) {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        position: 'relative',
        display: 'flex',
        fontFamily: FONT.sansJP,
        overflow: 'hidden',
        background: BRAND.ink,
      }}
    >
      <img
        src={data.backgroundImage}
        width={1200}
        height={630}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1200,
          height: 630,
          objectFit: 'cover',
        }}
      />

      {/* 左60%可読性スクリーン (右40%は表紙をそのまま見せる) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 720,
          height: 630,
          display: 'flex',
          background: OGP_PRODUCT_SCRIM.leftGradient,
        }}
      />

      {/* セーフゾーン */}
      <div
        style={{
          position: 'absolute',
          left: 64,
          top: 64,
          width: 620,
          height: 502,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* チャンネルラベル */}
        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              padding: '8px 16px',
              background: BRAND.primary,
              color: BRAND.white,
              fontFamily: FONT.sansJP,
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            {data.channelLabel}
          </div>
        </div>

        {/* タイトル + 価格 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.titleLines.map((line, i) => (
              <div
                key={`${i}-${line}`}
                style={{
                  display: 'flex',
                  fontFamily: FONT.sansJP,
                  fontWeight: 900,
                  fontSize: data.titleFontSize,
                  color: BRAND.white,
                  lineHeight: 1.28,
                  letterSpacing: -1,
                }}
              >
                {line}
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              width: 64,
              height: 4,
              background: BRAND.vermilion,
              marginTop: 24,
              marginBottom: 20,
            }}
          />
          <div
            style={{
              display: 'flex',
              fontFamily: FONT.sansJP,
              fontWeight: 900,
              fontSize: 40,
              color: BRAND.white,
            }}
          >
            {`¥${data.priceYen.toLocaleString('ja-JP')}`}
          </div>
        </div>

        {/* ロゴ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontWeight: 900, fontSize: 18, color: BRAND.white, fontFamily: FONT.sansJP }}>
            stats
          </span>
          <span
            style={{
              fontWeight: 900,
              fontSize: 18,
              color: BRAND.white,
              background: BRAND.primary,
              padding: '2px 6px',
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
