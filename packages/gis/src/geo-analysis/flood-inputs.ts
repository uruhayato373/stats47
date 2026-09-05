/** A31b 2025の承認済み配布集合。河川区分とZIP内の災害規模は別の軸。
 * 公式一覧を2026-09-05照合。集合変更時は原典差分を確認して更新する。
 * https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A31b-2025.html
 */
export const FLOOD_SOURCE_PAGE =
  'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A31b-2025.html';
export const FLOOD_VERSION = '25';
export const FLOOD_HAZARD_SCALE = '20';
export type FloodRiverClass = '10' | '20';
const MESHES_BY_RIVER_CLASS: Record<FloodRiverClass, readonly string[]> = {
  '10': '3927 4630 4730 4731 4828 4829 4830 4831 4928 4929 4930 4931 4932 5029 5030 5031 5032 5033 5034 5035 5036 5129 5130 5131 5132 5133 5134 5135 5136 5137 5138 5229 5231 5232 5233 5234 5235 5236 5237 5238 5239 5240 5332 5333 5334 5335 5336 5337 5338 5339 5340 5433 5436 5437 5438 5439 5440 5536 5537 5538 5539 5540 5541 5636 5637 5638 5639 5640 5641 5738 5739 5740 5741 5839 5840 5841 5940 5941 6040 6041 6140 6141 6240 6241 6339 6340 6341 6342 6343 6440 6441 6442 6443 6444 6541 6542 6543 6544 6545 6641 6642 6643 6644 6645 6741 6742 6841'.split(
    ' '
  ),
  '20': '3927 3928 4028 4730 4829 4830 4831 4930 4931 4932 5030 5031 5032 5033 5034 5035 5036 5133 5134 5135 5136 5138 5234 5235 5236 5237 5238 5239 5240 5334 5335 5336 5337 5338 5339 5340 5436 5437 5438 5439 5440 5536 5537 5538 5539 5540 5541 5636 5637 5638 5639 5640 5738 5739 5740 5741 5840 5841 5940 5941 6040 6041 6140 6141 6239 6240 6243 6339 6340 6341 6342 6343 6439 6440 6441 6442 6443 6444 6445 6540 6541 6542 6543 6544 6545 6641 6642 6643 6644 6645 6741 6742 6841 6842'.split(
    ' '
  ),
};

export interface FloodArchive {
  readonly riverClass: FloodRiverClass;
  readonly hazardScale: typeof FLOOD_HAZARD_SCALE;
  readonly meshCode: string;
  readonly url: string;
  readonly key: string;
  readonly entrySuffix: string;
}

export const FLOOD_ARCHIVES: readonly FloodArchive[] = (
  ['10', '20'] as const
).flatMap((riverClass) =>
  MESHES_BY_RIVER_CLASS[riverClass].map((meshCode) => ({
    riverClass,
    hazardScale: FLOOD_HAZARD_SCALE,
    meshCode,
    url: `https://nlftp.mlit.go.jp/ksj/gml/data/A31b/A31b-25/A31b-25_${riverClass}_${meshCode}_GEOJSON.zip`,
    key: `gis/mlit-ksj/A31b/25/source/${riverClass}/${meshCode}.zip`,
    entrySuffix: `A31b-${FLOOD_HAZARD_SCALE}-25_${riverClass}_${meshCode}.geojson`,
  }))
);

const EXPECTED_KEYS = new Set(FLOOD_ARCHIVES.map((a) => a.key));

/** 件数が同じでも、区分/メッシュの欠落・重複・すり替えなら拒否する。 */
export function assertFloodArchiveKeys(keys: readonly unknown[]): void {
  const actual = new Set(keys);
  if (
    keys.length !== EXPECTED_KEYS.size ||
    actual.size !== keys.length ||
    [...EXPECTED_KEYS].some((key) => !actual.has(key))
  ) {
    throw new Error(
      `A31b洪水入力集合不一致: 河川区分10+20の${EXPECTED_KEYS.size}ファイルが必要 (actual=${keys.length})`
    );
  }
}

export function parseFloodArchiveCatalog(
  html: string
): readonly FloodArchive[] {
  const paths = new Set(
    html.match(
      /\/ksj\/gml\/data\/A31b\/A31b-25\/A31b-25_[0-9]{2}_[0-9]{4}_GEOJSON\.zip/g
    ) ?? []
  );
  const expectedPaths = new Set(
    FLOOD_ARCHIVES.map((a) => new URL(a.url).pathname)
  );
  if (
    paths.size !== expectedPaths.size ||
    [...expectedPaths].some((p) => !paths.has(p))
  ) {
    throw new Error('A31b公式配布一覧が承認済みの河川区分10+20と一致しません');
  }
  return FLOOD_ARCHIVES;
}
