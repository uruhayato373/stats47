interface RankingPageHeadAssetsProps {
  structuredData: object;
  faqStructuredData: object | null;
}

export function RankingPageHeadAssets({
  structuredData,
  faqStructuredData,
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
    </>
  );
}
