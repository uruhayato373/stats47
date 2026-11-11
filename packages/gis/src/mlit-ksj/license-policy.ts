import data from '../../../../data/geo/ksj/license-policy.json';
import type { KsjLicense } from './types';

export type KsjSourcePublicationPolicy =
  'unassessed' | 'local-only' | 'review-required' | 'public-r2-eligible';

export type KsjCommercialUsePolicy =
  | 'unassessed'
  | 'allowed-with-attribution'
  | 'manual-review'
  | 'spatial-result-only';

export interface KsjLicensePolicy {
  /** 元データやTopoJSONをpublic R2へ複製できるか。 */
  sourcePublication: KsjSourcePublicationPolicy;
  /** 広告・販売を伴う成果物で使える範囲。 */
  commercialUse: KsjCommercialUsePolicy;
  /** 公開JSONやCSVのような構造化された派生データを無審査で配信できるか。 */
  publicStructuredOutputAllowed: boolean;
  attributionRequired: boolean;
}

/**
 * KSJの利用条件を、元データ公開と商用成果物の2軸へ決定的に展開する。
 * 区分ごとの判定表の正本は台帳 `geo.ksj-license-policy` (data/geo/ksj/license-policy.json)。呼ぶたびに写しを返す。
 *
 * `non-commercial`でも、旧約款は「GISによる空間演算結果（データベースでないもの）」を
 * 出典・加工者表示付きで利用できるとしている。ただし公開JSON/CSVや元TopoJSONはその例外に
 * 含めず、書面確認なしでは公開しない。
 */
export function getKsjLicensePolicy(
  license: KsjLicense | null | undefined
): KsjLicensePolicy {
  const policies = data.policies as Record<string, KsjLicensePolicy>;
  const policy = license && Object.prototype.hasOwnProperty.call(policies, license) ? policies[license] : data.unassessed;
  return { ...policy } as KsjLicensePolicy;
}

export function assertKsjPublicStructuredOutputAllowed(input: {
  dataId: string;
  license: KsjLicense | null | undefined;
  output: string;
}): void {
  const policy = getKsjLicensePolicy(input.license);
  if (policy.publicStructuredOutputAllowed) return;
  throw new Error(
    `${input.dataId} (${input.license ?? 'unassessed'}) は ${input.output} の公開構造化データを生成できません` +
      ` (commercialUse=${policy.commercialUse}, sourcePublication=${policy.sourcePublication})`
  );
}
