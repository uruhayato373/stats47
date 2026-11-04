import { REGIONS, fetchPrefectures } from "@stats47/area";

export interface RegionRankRow {
  rank: number;
  areaName: string;
}

/**
 * 地方ごとに順位の良い順で並べた表 (プロンプト埋め込み用)。
 * 「地方内で最も高い/低い」の主張が同じ地方の 2 県で矛盾する誤りを、モデルの記憶ではなく提供データで防ぐ
 * (2026-09-05 batch2 で critic が検出した事実誤り)。括弧を使わない (paren-number を実演しない)。
 * 県名の対応付けが 9 割未満なら空文字を返し、誤った表を出さない。
 */
export function buildRegionRankText(rows: readonly RegionRankRow[]): string {
  const prefectures = fetchPrefectures();
  const codeToName = new Map(prefectures.map((p) => [p.prefCode, p.prefName]));
  const byName = new Map(rows.map((r) => [r.areaName, r]));
  let matched = 0;
  const lines = REGIONS.map((region) => {
    const members = region.prefectures
      .map((code) => byName.get(codeToName.get(code) ?? ""))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .sort((a, b) => a.rank - b.rank);
    matched += members.length;
    return `- ${region.regionName}: ${members.map((r) => `${r.areaName} ${r.rank}位`).join(", ") || "該当県なし"}`;
  });
  if (rows.length === 0 || matched < rows.length * 0.9) return "";
  return lines.join("\n");
}
