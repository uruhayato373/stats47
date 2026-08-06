/**
 * ai-content 日次生成の「キー別の成否」を state に記録し、critic に繰り返し落ちる
 * 常習キーを quarantine (隔離) するための純ロジック + CLI。
 *
 * なぜ要るか (2026-08-07):
 *   verify を partial-publish 化 (通過分だけ publish・失敗キーは drop) しても、失敗キーは
 *   R2 に載らないので next 回も needs-regen として再ピックされ、毎回バッチの 1 枠と生成
 *   コストを食い潰す。実例 `manufacturing-industry-added-value` は 47 県 commentary の
 *   定型重複で 6 周直しても REVISE のまま、1 件が毎回バッチを道連れにしていた。
 *   → 連続失敗が threshold に達したキーは `--next` から外し、LATEST.md に「要手動対応」
 *      として可視化する (黙って永久に消さない)。一度でも PASS したらカウントを消す。
 *
 * SSOT: .claude/state/ai-content/generation-failures.json
 *   { "version": 1, "keys": { "<key>": { failCount, lastReason, lastFailedAt, firstFailedAt } } }
 *
 * 純関数 (updateFailureState / quarantinedKeys) を export し、CLI から分離してテストする。
 * テスト: .claude/scripts/ai-content/__tests__/generation-outcome.test.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

/** これ以上連続で失敗したキーは --next の自動ピックから外す。 */
export const QUARANTINE_THRESHOLD = 3;

/** 空の state を返す。 */
export function emptyFailureState() {
  return { version: 1, keys: {} };
}

/**
 * 生成結果を state に反映する純関数。
 * - passed のキーは state から削除する (成功したので失敗履歴をリセット)。
 * - failed のキーは failCount を +1 し、理由と日付を更新する。
 * 引数の state は変更せず、新しいオブジェクトを返す。
 */
export function updateFailureState(state, { failed = [], passed = [], reason = "", date }) {
  if (!date) throw new Error("updateFailureState: date は必須 (YYYY-MM-DD)");
  const keys = { ...(state?.keys ?? {}) };
  for (const key of passed) delete keys[key];
  for (const key of failed) {
    const prev = keys[key];
    keys[key] = {
      failCount: (prev?.failCount ?? 0) + 1,
      lastReason: reason || prev?.lastReason || "unknown",
      lastFailedAt: date,
      firstFailedAt: prev?.firstFailedAt ?? date,
    };
  }
  return { version: 1, keys };
}

/** failCount が threshold 以上のキー集合を返す (quarantine 対象)。 */
export function quarantinedKeys(state, threshold = QUARANTINE_THRESHOLD) {
  const keys = state?.keys ?? {};
  return new Set(
    Object.entries(keys)
      .filter(([, v]) => (v?.failCount ?? 0) >= threshold)
      .map(([k]) => k),
  );
}

/** state を読む (無ければ空)。壊れていたら空にフォールバック (集計を止めない)。 */
export function loadFailureState(path) {
  if (!existsSync(path)) return emptyFailureState();
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    if (parsed && typeof parsed === "object" && parsed.keys) return parsed;
  } catch {
    /* fall through */
  }
  return emptyFailureState();
}

function parseCsvArg(value) {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function argValue(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

function main() {
  const argv = process.argv.slice(2);
  const statePath = argValue(argv, "--state");
  if (!statePath) throw new Error("--state <path> は必須");
  const failed = parseCsvArg(argValue(argv, "--failed"));
  const passed = parseCsvArg(argValue(argv, "--passed"));
  const reason = argValue(argv, "--reason") ?? "";
  const date = argValue(argv, "--date") ?? new Date().toISOString().slice(0, 10);

  const next = updateFailureState(loadFailureState(statePath), { failed, passed, reason, date });
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(next, null, 2) + "\n");

  const q = quarantinedKeys(next);
  process.stderr.write(
    `[record-generation-outcome] passed ${passed.length} / failed ${failed.length} ` +
      `→ 追跡中 ${Object.keys(next.keys).length} 件 / quarantine (${QUARANTINE_THRESHOLD}回以上) ${q.size} 件` +
      (q.size ? `: ${[...q].join(", ")}` : "") +
      "\n",
  );
}

// CLI として実行されたときだけ main を走らせる (import 時は純関数だけ使える)。
if (process.argv[1] && process.argv[1].endsWith("record-generation-outcome.mjs")) {
  try {
    main();
  } catch (e) {
    process.stderr.write(`[record-generation-outcome] ${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
  }
}
