import { ImageResponse } from "next/og";

import { ALL_THEMES } from "@/features/theme-dashboard/config/all-themes";

export const alt = "テーマダッシュボード";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ISR 30 日: テーマ OGP は ALL_THEMES 設定のみを参照し内容が変わらない。最長キャッシュで Workers CPU ms を削減。
export const revalidate = 2592000;

// ALL_THEMES にある全テーマを静的生成（DB 依存なし）
export function generateStaticParams() {
  return ALL_THEMES.map((t) => ({ themeSlug: t.themeKey }));
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ themeSlug: string }>;
}) {
  const { themeSlug } = await params;
  const theme = ALL_THEMES.find((t) => t.themeKey === themeSlug);
  const title = theme?.title ?? "テーマダッシュボード";
  const description = theme?.description ?? "都道府県別統計ダッシュボード";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "#94a3b8",
              fontWeight: 400,
              textAlign: "center",
              maxWidth: "900px",
            }}
          >
            {description}
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#64748b",
              marginTop: "16px",
            }}
          >
            統計で見る都道府県
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
