/**
 * 運営者 Person schema（E-E-A-T、#76 T3-EEAT-02）
 *
 * stats47 の運営者 (KAZU) を表現する schema.org/Person。
 * Article の author と /about の主体として使用する。
 */

import {
  OPERATOR_PROFILE,
  OPERATOR_SOCIAL_URLS,
} from '@/config/operator-profile';

export { OPERATOR_SOCIAL_URLS };

/**
 * 運営者 Person の安定 @id を返す。
 * /about の Person と各記事 author を同一エンティティとして結ぶための共通識別子。
 */
export function getOperatorPersonId(baseUrl: string) {
  return `${baseUrl}${OPERATOR_PROFILE.links.about}#operator`;
}

/** Person schema を生成する（/about の正準エンティティ） */
export function buildOperatorPersonSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': getOperatorPersonId(baseUrl),
    name: OPERATOR_PROFILE.name,
    url: `${baseUrl}${OPERATOR_PROFILE.links.about}`,
    jobTitle: OPERATOR_PROFILE.role,
    description: OPERATOR_PROFILE.description,
    knowsAbout: [...OPERATOR_PROFILE.expertise],
    worksFor: {
      '@type': 'Organization',
      name: '統計で見る都道府県',
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
    '@type': 'Person',
    '@id': getOperatorPersonId(baseUrl),
    name: OPERATOR_PROFILE.name,
    url: `${baseUrl}${OPERATOR_PROFILE.links.about}`,
    jobTitle: OPERATOR_PROFILE.role,
    worksFor: {
      '@type': 'Organization',
      name: '統計で見る都道府県',
      url: baseUrl,
    },
  };
}
