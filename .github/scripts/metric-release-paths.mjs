/**
 * 指標リリースの対象パス (R2 キー) の定義 — METRIC-RELEASE-PATHS-SSOT-01。
 *
 * deploy-workers.yml の exact manifest (どのキーを R2 へ送るか) と、PR の E2E 用の中継
 * r2-overlay-server.mjs (どのキーを手元の生成物から返すか) が、以前は同じ種類の生成物を別々の正規表現で
 * 持っていた。2026-10-21 に市区町村データブックを足したとき両方を手で直した (436f46b43)。二重管理は
 * いずれずれるので、種類ごとに 1 行でここに置き、両方がこの定義を import する。
 *
 * overlay: true は中継が手元の .local/r2 から返す種類。false の種類は理由を書く。
 */

/** @type {ReadonlyArray<{id: string, pattern: string, overlay: boolean, reason?: string}>} */
export const METRIC_RELEASE_KINDS = [
  { id: "ranking-item", pattern: String.raw`ranking\/[a-z0-9-]+\/item\.json`, overlay: true },
  { id: "ranking-items-all", pattern: String.raw`ranking-items\/all\.json`, overlay: true },
  { id: "home-featured", pattern: String.raw`home\/featured\.json`, overlay: true },
  { id: "municipality-ranking", pattern: String.raw`municipalities\/ranking\/[a-z0-9-]+\/(?:item|values)\.json`, overlay: true },
  {
    id: "municipality-ai-content",
    pattern: String.raw`municipalities\/ranking\/[a-z0-9-]+\/ai-content\.json`,
    overlay: false,
    reason: "中継は本番の解説を取り次ぐ。手元で返すように変えた記録が無く、E2E で確かめるまでは今の挙動を保つ",
  },
  { id: "city-databook", pattern: String.raw`areas\/[0-9]{5}\/cities\/[0-9]{5}\/databook\.json`, overlay: true },
  {
    id: "categories",
    pattern: String.raw`categories\/(?:all\.json|[a-z0-9-]+\/items\.json)`,
    overlay: false,
    reason: "中継は本番の一覧を取り次ぐ。手元で返すように変えた記録が無く、E2E で確かめるまでは今の挙動を保つ",
  },
  {
    id: "survey",
    pattern: String.raw`survey\/(?:all\.json|[a-z0-9-]+\/items\.json)`,
    overlay: false,
    reason: "中継は本番の一覧を取り次ぐ。手元で返すように変えた記録が無く、E2E で確かめるまでは今の挙動を保つ",
  },
  {
    id: "page-components",
    pattern: String.raw`page-components\/[a-z0-9/-]+\.json`,
    overlay: false,
    reason: "中継は apps/web/scripts/data/page-components/ から別の関数 (localPageComponentsFile) で返す",
  },
];

const alternation = (kinds) => kinds.map((kind) => kind.pattern).join("|");

/** deploy-workers.yml が R2 へ送るキー (先頭に / なし) */
export const RELEASE_KEY_PATTERN = new RegExp(String.raw`^app\/(?:${alternation(METRIC_RELEASE_KINDS)})$`);

/** r2-overlay-server.mjs が .local/r2 から返す URL のパス (先頭に / あり) */
export const OVERLAY_PATH_PATTERN = new RegExp(
  String.raw`^\/app\/(?:${alternation(METRIC_RELEASE_KINDS.filter((kind) => kind.overlay))})$`,
);
