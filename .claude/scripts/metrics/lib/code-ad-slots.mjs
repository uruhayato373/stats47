/**
 * code-ad-slots — コード側 AdSense slot 定数 (apps/web/src/lib/google-adsense/constants.ts) の
 * 決定的パーサ。
 *
 * なぜ正規表現パースか: このスクリプト群は `.mjs` (Node 直実行) で、TypeScript の
 * `constants.ts` を import できない。ビルドを挟むと計測スクリプトが apps/web のビルドに
 * 依存してしまうため、構造が単純な同ファイルを文字列として決定的に読む。
 *
 * constants.ts の想定構造 (これ以外の形は無視され、`parseCodeAdSlots` の結果に現れない):
 *   export const NAME: AdSlotConfig = {
 *     slotId: "1234567890",
 *     adUnitName: "stats47-...",   // A2 で追加。無い間は null
 *     format: "rectangle",
 *     pending: true,               // 任意。未発行プレースホルダの宣言
 *   };
 *
 * pure module (parse は文字列を取る)。テスト: __tests__/code-ad-slots.test.mjs
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_ROOT } from "./auth.mjs";

/** constants.ts の既定パス。 */
export const CODE_AD_SLOTS_PATH = "apps/web/src/lib/google-adsense/constants.ts";

/**
 * constants.ts のソース文字列から slot 定数を抽出する (pure)。
 *
 * @param {string} source
 * @returns {Array<{exportName:string, slotId:string, format:string|null, adUnitName:string|null, pending:boolean}>}
 */
export function parseCodeAdSlots(source) {
  if (typeof source !== "string" || source.length === 0) return [];
  const out = [];
  // `export const NAME: AdSlotConfig = { ... };` の本体を捕獲する。
  // 本体に `}` を含むネストは現状存在しないため [^}]* で足りる (ネストが増えたらここが空振りし、
  // lint 側で「コード側 slot が 0 件」として検出される = 沈黙しない)。
  const re = /export\s+const\s+([A-Z0-9_]+)\s*:\s*AdSlotConfig\s*=\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const [, exportName, body] = m;
    const pick = (key) => {
      const hit = body.match(new RegExp(`${key}\\s*:\\s*["']([^"']*)["']`));
      return hit ? hit[1] : null;
    };
    const slotId = pick("slotId");
    if (slotId === null) continue; // slotId を持たないものは slot 定数ではない
    out.push({
      exportName,
      slotId,
      format: pick("format"),
      adUnitName: pick("adUnitName"),
      pending: /pending\s*:\s*true/.test(body),
    });
  }
  return out;
}

/**
 * slot 一覧から突き合わせ用の索引を作る (pure)。
 *
 * 同一 slotId を複数の export が共用するケース (CONTENT_FOOTER と RANKING_PAGE_FOOTER) があるため
 * slotId → export 名は配列で持つ。
 *
 * @param {ReturnType<typeof parseCodeAdSlots>} slots
 */
export function indexCodeAdSlots(slots) {
  const bySlotId = new Map();
  const byAdUnitName = new Map();
  for (const s of slots) {
    if (s.slotId) {
      if (!bySlotId.has(s.slotId)) bySlotId.set(s.slotId, []);
      bySlotId.get(s.slotId).push(s);
    }
    if (s.adUnitName) {
      if (!byAdUnitName.has(s.adUnitName)) byAdUnitName.set(s.adUnitName, []);
      byAdUnitName.get(s.adUnitName).push(s);
    }
  }
  return { bySlotId, byAdUnitName, slots };
}

/** constants.ts を読んでパースする (I/O)。 */
export function loadCodeAdSlots(root = PROJECT_ROOT) {
  const source = readFileSync(join(root, CODE_AD_SLOTS_PATH), "utf-8");
  return indexCodeAdSlots(parseCodeAdSlots(source));
}
