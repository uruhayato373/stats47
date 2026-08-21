/**
 * asp-operation-store.mjs — operation plan / journal のファイル I/O (doc 42 §6.3-6.4)
 * ---------------------------------------------------------------------------
 * 判定は lib/asp-operation-core.mjs (純粋コア) が持ち、ここは**保存と読み出しだけ**を行う。
 * lock と health は affiliate-ops.mjs が同じ .local/affiliate-ops/ 配下で扱う。
 *
 * 置き場: `.local/affiliate-ops/` (端末固有・git を dirty にしない — doc 42 §11.2)
 *   plans/<operationId>.json          … dry-run が出す申請計画
 *   plans/<operationId>.expired.json  … 再照合で失効させた計画 (証拠として残す)
 *   journal.ndjson                    … append-only の 1 行 1 event
 *
 * ★journal は「押した」の唯一の証跡なので、**書いてから押す / 押してから書く**の順序を
 *   呼び出し側が守れるよう、append は fsync まで完了してから返る。途中で kill されても
 *   `sent` が残っていれば canAutoResend が false になり、二重申請にならない。
 *
 * テスト: .claude/scripts/ads/__tests__/asp-operation-store.test.mjs
 */
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  renameSync,
  openSync,
  writeSync,
  fsyncSync,
  closeSync,
} from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

/** 端末固有の運用ディレクトリ。テストは root を差し替える。 */
export function opsDir(root = REPO_ROOT) {
  return join(root, ".local/affiliate-ops");
}

export function plansDir(root = REPO_ROOT) {
  return join(opsDir(root), "plans");
}

export function journalPath(root = REPO_ROOT) {
  return join(opsDir(root), "journal.ndjson");
}

/** plan を保存し、保存先パスを返す。既存 operationId は上書きしない (計画のすり替え防止)。 */
export function writePlan(plan, root = REPO_ROOT) {
  const dir = plansDir(root);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${plan.operationId}.json`);
  if (existsSync(path)) throw new Error(`plan が既にある: ${plan.operationId}`);
  writeFileSync(path, JSON.stringify(plan, null, 2) + "\n", "utf-8");
  return path;
}

/** plan を読む。無ければ null (呼び出し側が「plan が無い」と「壊れている」を区別できるように投げ分ける)。 */
export function readPlan(operationId, root = REPO_ROOT) {
  const path = join(plansDir(root), `${operationId}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

/**
 * plan を失効させる (§6.3「1 項目でも違えば押さずに plan を失効させる」)。
 * 削除ではなく改名で残す — 何を作り、なぜ押さなかったかを後から追えるようにするため。
 */
export function expirePlan(operationId, root = REPO_ROOT) {
  const from = join(plansDir(root), `${operationId}.json`);
  if (!existsSync(from)) return null;
  const to = join(plansDir(root), `${operationId}.expired.json`);
  renameSync(from, to);
  return to;
}

/** journal に 1 event を append する (fsync まで完了してから返る)。 */
export function appendJournal(event, root = REPO_ROOT) {
  const path = journalPath(root);
  mkdirSync(dirname(path), { recursive: true });
  const fd = openSync(path, "a");
  try {
    writeSync(fd, JSON.stringify(event) + "\n");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  return path;
}

/** ある operation の event 列を古い順で返す。壊れた行は落とさず throw する (証跡を黙って捨てない)。 */
export function readJournal(operationId, root = REPO_ROOT) {
  const path = journalPath(root);
  if (!existsSync(path)) return [];
  const events = [];
  const lines = readFileSync(path, "utf-8").split("\n");
  for (const [i, line] of lines.entries()) {
    if (!line.trim()) continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      throw new Error(`journal ${i + 1} 行目が壊れている: ${path}`);
    }
    if (parsed.operationId === operationId) events.push(parsed);
  }
  return events;
}
