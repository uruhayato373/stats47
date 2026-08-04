/**
 * **コミット済みの実カタログ** (.claude/state/ads/affiliate-catalog.json) を検証する。
 *
 * CI は `node --test .claude/scripts/ads/__tests__/` を直叩きする (pr-quality-check.yml)
 * ので、このファイルを置くだけでカタログの構造破壊が PR で落ちる (配線変更は不要)。
 *
 * 方針:
 *   - **構造違反 (status 語彙外 / 10 軸外 vertical / 識別子欠落) は fail**
 *   - name 未補完・vertical 未設定は実機を見ないと直せないため fail にせず、
 *     **件数が悪化していないこと (退行チェック)** だけを見る。実機照合で減る想定。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { validateCatalog } from "../lib/affiliate-status-core.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const CATALOG_PATH = join(REPO_ROOT, ".claude/state/ads/affiliate-catalog.json");

/**
 * 2026-08-04 の整理直後の未補完件数。実機照合 (affiliate-status --write) で
 * 名前が補完されるたびに減るはず。**増えたら退行**なのでここで止める。
 * 減ったら本値を下げること (下げ忘れを防ぐため、大幅に下回った場合も知らせる)。
 */
// 実測 (2026-08-04 時点): name 未補完 22 件 (afb の「【PID:N】カテゴリ」形式 19 + null 3)、
// vertical 未設定 16 件。name は afb の 4 行ブロック解析を status に入れたので次回
// --write で大きく減る想定。
const NAME_PLACEHOLDER_BASELINE = 22;
const VERTICAL_UNSET_BASELINE = 16;

const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
const result = validateCatalog(catalog);

test("実カタログに構造違反が無い", () => {
  assert.deepEqual(result.errors, [], `構造違反:\n${result.errors.join("\n")}`);
});

test("programs が空でない (読み込み経路の破損検知)", () => {
  assert.ok(Object.keys(catalog.programs ?? {}).length > 0);
});

test("approved の name 未補完が増えていない", () => {
  const n = result.warnings.filter((w) => w.includes("name 未補完")).length;
  assert.ok(
    n <= NAME_PLACEHOLDER_BASELINE,
    `name 未補完が ${n} 件 (baseline ${NAME_PLACEHOLDER_BASELINE})。増えている = 実機照合で名前を取れていない`,
  );
});

test("approved の vertical 未設定が増えていない", () => {
  const n = result.warnings.filter((w) => w.includes("vertical 未設定")).length;
  assert.ok(
    n <= VERTICAL_UNSET_BASELINE,
    `vertical 未設定が ${n} 件 (baseline ${VERTICAL_UNSET_BASELINE})`,
  );
});

test("verifiedAt が ISO date 形式", () => {
  assert.match(String(catalog.verifiedAt ?? ""), /^\d{4}-\d{2}-\d{2}$/);
});
