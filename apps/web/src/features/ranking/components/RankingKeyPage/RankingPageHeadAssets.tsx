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
      {initialTileUrls.map((url, idx) => (
        <link
          key={url}
          rel="preload"
          as="image"
          href={url}
          fetchPriority={idx === 0 ? "high" : "auto"}
          media="(min-width: 1024px)"
        />
      ))}
    </>
  );
}
