import { MEDIA_QUERIES } from "@/constants/breakpoints";
interface RankingPageHeadAssetsProps {
  structuredData: object;
  /**
   * 使わない。BreadcrumbList JSON-LD は RankingPageClientShell の Breadcrumbs が出す
   * (ここでも出すと同じページに 2 つ並ぶ)。呼び出し側の受け渡しを外すまで型だけ残す。
   */
  breadcrumbStructuredData?: object;
  faqStructuredData: object | null;
  initialTileUrls: string[];
}

export function RankingPageHeadAssets({
  structuredData,
  faqStructuredData,
  initialTileUrls,
}: RankingPageHeadAssetsProps) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {faqStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
      )}
      {initialTileUrls.map((url, idx) => {
        // 先頭タイルはモバイルでも LCP 要素そのもの。ここに media を付けると初期
        // document から発見されず、2026-08-05 の trace では load delay 5,835ms を
        // 生んでいた (LCP 5,853ms)。残り 3 枚は 2x2 グリッドの右/下で、モバイル
        // viewport には出ないため desktop 限定のままにする。
        const isLcpTile = idx === 0;
        return (
          <link
            key={url}
            rel="preload"
            as="image"
            href={url}
            fetchPriority={isLcpTile ? "high" : "auto"}
            media={isLcpTile ? undefined : MEDIA_QUERIES.aboveLg}
          />
        );
      })}
    </>
  );
}
