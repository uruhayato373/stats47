import { REGIONS } from "@stats47/area";

/**
 * 交通網の変遷の表示範囲の地方区分。
 *
 * サイト共通の 7 地方区分 (`@stats47/area` の REGIONS) から、北海道と沖縄を単独の範囲に切り出す。
 * 共通区分はほかのページも使うので変えない。県の顔ぶれは共通区分から導き、ここで手書きしない。
 *
 * 切り出す理由: 縮尺は範囲内の路線の広がりで決めるので、「北海道・東北」では東北 6 県が、
 * 「九州・沖縄」では本土から 600km 以上離れた沖縄のために九州が小さく描かれる。
 * 北海道・沖縄は 1 道県だけの範囲になるので、地方のページは作らず県のページ (`/01`・`/47`) を使う。
 */
const SPLITS: Readonly<Record<string, readonly { code: string; name: string; prefCodes?: readonly string[] }[]>> = {
  hokkaido_tohoku: [
    { code: "hokkaido", name: "北海道", prefCodes: ["01"] },
    { code: "tohoku", name: "東北" },
  ],
  kyushu: [
    { code: "kyushu", name: "九州" },
    { code: "okinawa", name: "沖縄", prefCodes: ["47"] },
  ],
};

export interface InfraRegion {
  readonly code: string;
  readonly name: string;
  /** 2 桁県コード */
  readonly prefCodes: readonly string[];
}

/** 範囲の切替に並べる 9 区分 (北海道・東北・関東・中部・近畿・中国・四国・九州・沖縄) */
export const INFRA_SCOPE_REGIONS: readonly InfraRegion[] = REGIONS.flatMap((region) => {
  const members = region.prefectures.map((code) => code.slice(0, 2));
  const splits = SPLITS[region.regionCode];
  if (!splits) return [{ code: region.regionCode, name: region.regionName, prefCodes: members }];
  const taken = new Set(splits.flatMap((split) => split.prefCodes ?? []));
  return splits.map((split) => ({
    code: split.code,
    name: split.name,
    prefCodes: split.prefCodes ?? members.filter((code) => !taken.has(code)),
  }));
});

/** 地方のページを持つ区分 (2 都道府県以上)。1 道県の区分は県のページで表示する */
export const INFRA_REGIONS: readonly InfraRegion[] = INFRA_SCOPE_REGIONS.filter(
  (region) => region.prefCodes.length > 1,
);

export function findInfraScopeRegionOfPref(prefCode: string): InfraRegion | null {
  return INFRA_SCOPE_REGIONS.find((region) => region.prefCodes.includes(prefCode)) ?? null;
}
