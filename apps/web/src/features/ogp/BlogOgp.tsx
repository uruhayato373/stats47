import { BRAND, FONT } from './brand';

export interface BlogOgpData {
  title: string;
  subtitle?: string | null;
  date: string;
  category?: string | null;
}

interface Props {
  data: BlogOgpData;
}

// BlogMinimal A案: 白 + カテゴリバッジ + タイトル + 赤ライン
export function BlogOgp({ data }: Props) {
  const category = data.category ?? 'BLOG';

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
      {/* 左右ストライプ背景 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 285,
          height: 630,
          background: `repeating-linear-gradient(135deg, ${BRAND.paper} 0 20px, #fff 20px 40px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: 285,
          height: 630,
          background: `repeating-linear-gradient(135deg, ${BRAND.paper} 0 20px, #fff 20px 40px)`,
        }}
      />

      {/* 中央パネル */}
      <div
        style={{
          position: 'absolute',
          left: 285,
          top: 0,
          width: 630,
          height: 630,
          background: '#fff',
          boxShadow: '0 0 40px rgba(15,23,42,0.08)',
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
          justifyContent: 'space-between',
          padding: '48px 36px',
          boxSizing: 'border-box',
        }}
      >
        {/* ヘッダー: カテゴリ + 日付 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              padding: '3px 10px',
              background: BRAND.primary,
              color: '#fff',
              fontFamily: FONT.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 3,
            }}
          >
            {category}
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              color: BRAND.muted,
              letterSpacing: 2,
            }}
          >
            {data.date}
          </div>
        </div>

        {/* 本文 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: FONT.sansJP,
              fontWeight: 900,
              fontSize: 46,
              color: BRAND.ink,
              lineHeight: 1.25,
              letterSpacing: -1,
            }}
          >
            {data.title}
          </div>
          <div
            style={{
              width: 60,
              height: 3,
              background: BRAND.vermilion,
              margin: '20px 0',
            }}
          />
          {data.subtitle && (
            <div
              style={{
                fontFamily: FONT.sansJP,
                fontSize: 18,
                color: BRAND.muted,
                fontWeight: 500,
              }}
            >
              {data.subtitle}
            </div>
          )}
        </div>

        {/* フッター */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 12,
            borderTop: `1px solid ${BRAND.line}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 16, color: BRAND.ink, fontFamily: FONT.sansJP }}>
              stats
            </span>
            <span
              style={{
                fontWeight: 900,
                fontSize: 16,
                color: '#fff',
                background: BRAND.primary,
                padding: '2px 6px',
                fontFamily: FONT.sansJP,
              }}
            >
              47
            </span>
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, color: BRAND.muted, letterSpacing: 2 }}>
            stats47.jp/blog
          </div>
        </div>
      </div>
    </div>
  );
}
