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

/**
 * 運営者 Person の安定 @id を返す。
 * /about の Person と各記事 author を同一エンティティとして結ぶための共通識別子。
 */
export function getOperatorPersonId(baseUrl: string) {
  return `${baseUrl}/about#operator`;
}

/** Person schema を生成する（/about の正準エンティティ） */
export function buildOperatorPersonSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": getOperatorPersonId(baseUrl),
    name: "KAZU",
    url: `${baseUrl}/about`,
    jobTitle: "データ可視化 / 元県庁職員（約 20 年）",
    description:
      "約 20 年間、自治体職員として統計の作る側・使う側の両方に身を置いたのち、在職中に独学で AI を学び IT・データ業界へ転職・独立。その経験を活かし、e-Stat などの一次統計を現代の UI/UX で再設計する stats47 を運営しています。",
    knowsAbout: [
      "公的統計",
      "都道府県データ",
      "データ可視化",
      "e-Stat",
      "地方自治体行政",
    ],
    worksFor: {
      "@type": "Organization",
      name: "統計で見る都道府県",
      url: baseUrl,
    },
    sameAs: [...OPERATOR_SOCIAL_URLS],
  };
}

/**
 * Article の author 用（inline、@context は親に含まれる）。
 * /about の正準 Person を @id で参照し、E-E-A-T のために同一人物として連結する。
 */
export function buildPersonAsAuthor(baseUrl: string) {
  return {
    "@type": "Person",
    "@id": getOperatorPersonId(baseUrl),
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
