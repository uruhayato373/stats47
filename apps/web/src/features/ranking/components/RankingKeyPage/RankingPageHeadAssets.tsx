interface RankingPageHeadAssetsProps {
  structuredData: object;
  breadcrumbStructuredData: object;
  faqStructuredData: object | null;
  initialTileUrls: string[];
}

export function RankingPageHeadAssets({
  structuredData,
  breadcrumbStructuredData,
  faqStructuredData,
  initialTileUrls,
}: RankingPageHeadAssetsProps) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
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
            media={isLcpTile ? undefined : "(min-width: 1024px)"}
          />
        );
      })}
    </>
  );
}
