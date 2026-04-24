/**
 * 運営者 Person schema（E-E-A-T、#76 T3-EEAT-02）
 *
 * stats47 の運営者 (KAZU) を表現する schema.org/Person。
 * Article の author と /about の主体として使用する。
 */

/** 運営者の SNS・外部プロフィール URL */
export const OPERATOR_SOCIAL_URLS = [
  "https://note.com/stats47",
  "https://x.com/stats47jp",
  "https://www.instagram.com/stats47jp/",
  "https://www.youtube.com/@stats47jp",
] as const;

/** Person schema を生成する */
export function buildOperatorPersonSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "KAZU",
    url: `${baseUrl}/about`,
    jobTitle: "データ可視化コンサルタント / 元県庁職員（20 年）",
    description:
      "20 年間、自治体職員として統計の作る側・使う側の両方に身を置いた経験を活かし、公的統計を現代の UI/UX で再設計する stats47 を運営。",
    worksFor: {
      "@type": "Organization",
      name: "統計で見る都道府県",
      url: baseUrl,
    },
    sameAs: [...OPERATOR_SOCIAL_URLS],
  };
}

/** Article の author 用（inline、@context は親に含まれる） */
export function buildPersonAsAuthor(baseUrl: string) {
  return {
    "@type": "Person",
    name: "KAZU",
    url: `${baseUrl}/about`,
    jobTitle: "データ可視化コンサルタント",
    worksFor: {
      "@type": "Organization",
      name: "統計で見る都道府県",
      url: baseUrl,
    },
  };
}
