import type { InfraNetworkKey } from "./types";

/**
 * R2 key。URL `/geo/history/<network>[/<scope>]` に対応させる
 * (`.claude/rules/r2-storage-design.md`「URL → R2 キーパス対応表」)。
 *
 * - `summary.json`   年 × 種別 × (全国・7 地方・47 県) の延長
 * - `manifest.json`  原典 SHA・利用条件・県帰属の件数・保存則・出力 SHA
 * - `national.topojson`           全国表示用 (簡略化)
 * - `region/<regionCode>.topojson` 地方表示用
 * - `pref/<NN>.topojson`          都道府県表示用 (県境で分割した区間だけ)
 * - `joints.topojson`             接合部 (IC・JCT) の点。全国 1 ファイル (高速道路だけ。主題 expressway-joints)
 */
export const INFRA_HISTORY_PREFIX = "app/geo/history/";

export function infraHistoryKey(network: InfraNetworkKey, file: string): string {
  return `${INFRA_HISTORY_PREFIX}${network}/${file}`;
}

export const infraHistoryKeys = {
  summary: (network: InfraNetworkKey) => infraHistoryKey(network, "summary.json"),
  manifest: (network: InfraNetworkKey) => infraHistoryKey(network, "manifest.json"),
  national: (network: InfraNetworkKey) => infraHistoryKey(network, "national.topojson"),
  region: (network: InfraNetworkKey, regionCode: string) =>
    infraHistoryKey(network, `region/${regionCode}.topojson`),
  prefecture: (network: InfraNetworkKey, prefCode: string) =>
    infraHistoryKey(network, `pref/${prefCode}.topojson`),
  joints: (network: InfraNetworkKey) => infraHistoryKey(network, "joints.topojson"),
} as const;

/** key が属する路線網。`app/geo/history/` 以外は null */
export function infraNetworkOfKey(key: string): string | null {
  if (!key.startsWith(INFRA_HISTORY_PREFIX)) return null;
  return key.slice(INFRA_HISTORY_PREFIX.length).split("/")[0] || null;
}
