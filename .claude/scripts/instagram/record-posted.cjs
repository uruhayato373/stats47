#!/usr/bin/env node
/**
 * IG の投稿を投稿台帳 (posts.json) へ記録する。
 *
 * `.claude/rules/sns-content-standards.md` §3 の「書込口は sns-posts-store.cjs のみ」
 * を守る唯一の IG 記録口。post-instagram-scheduled.yml は投稿直後にこれを呼ぶ。
 *
 * ## 使い方
 *
 *   # workflow から 1 件記録 (投稿直後)
 *   node .claude/scripts/instagram/record-posted.cjs \
 *     --domain ranking --content-key vacant-housing-rate \
 *     --permalink https://... [--posted-at 2026-08-03T06:23:09Z]
 *
 *   # ig-posted-log.jsonl から取り残しを一括回収 (冪等)
 *   node .claude/scripts/instagram/record-posted.cjs --from-log [--dry-run]
 *
 *   # ドリフト検知 (書き込まない。台帳に無い投稿があれば exit 1)
 *   node .claude/scripts/instagram/record-posted.cjs --check
 *
 * 判定は lib/ig-ledger-core.cjs (純粋関数・テスト付き)。既に posted の行は触らず、
 * scheduled / draft があれば新規行を足さずに昇格させる。
 */

const fs = require("node:fs");
const path = require("node:path");

const store = require("../lib/sns-posts-store.cjs");
const { decideLedgerAction, parsePostedLog } = require("../lib/ig-ledger-core.cjs");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const LOG_PATH = path.join(PROJECT_ROOT, ".claude/state/ig-posted-log.jsonl");

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : fallback;
}
const has = (name) => process.argv.includes(`--${name}`);

const DRY_RUN = has("dry-run");

/** 1 件を台帳へ反映し、実施した action を返す。 */
function apply(input, existing) {
  const decision = decideLedgerAction({ ...input, existing });
  if (decision.action === "skip") return decision;
  if (DRY_RUN) return decision;

  if (decision.action === "update") {
    store.updateById(decision.id, decision.patch);
  } else {
    store.insert(decision.record);
  }
  return decision;
}

/**
 * 台帳に載っていない投稿を数える (書き込まない)。
 *
 * workflow の記録 step が落ちても run は success になりうるので、**投稿経路とは別に**
 * ドリフトを検知する必要がある。2026-05-18〜08-03 の 94 件はこの検知が無かったために
 * 2 ヶ月半気づかれなかった。
 */
function check() {
  const rows = parsePostedLog(
    fs.existsSync(LOG_PATH) ? fs.readFileSync(LOG_PATH, "utf8") : "",
  );
  const existing = store.loadAll();
  const missing = rows.filter(
    (e) =>
      decideLedgerAction({
        domain: e.domain,
        contentKey: e.content_key,
        permalink: e.permalink ?? null,
        postedAt: e.posted_at ?? e.date ?? null,
        existing,
      }).action === "insert",
  );

  if (missing.length === 0) {
    console.log(`[ok] ig-posted-log ${rows.length} 件はすべて投稿台帳にある (drift 0)`);
    return 0;
  }
  console.error(
    `[drift] ${missing.length} 件が ig-posted-log にしか無い (posts.json が SSOT)。` +
      ` --from-log で回収する。sns-content-standards.md §3`,
  );
  for (const e of missing.slice(0, 10)) {
    console.error(`  - ${e.domain}/${e.content_key} (${e.posted_at ?? e.date ?? "?"})`);
  }
  if (missing.length > 10) console.error(`  ... 他 ${missing.length - 10} 件`);
  return 1;
}

function main() {
  if (has("check")) {
    process.exit(check());
  }
  const fromLog = has("from-log");
  const rows = fromLog
    ? parsePostedLog(fs.existsSync(LOG_PATH) ? fs.readFileSync(LOG_PATH, "utf8") : "").map((e) => ({
        domain: e.domain,
        contentKey: e.content_key,
        permalink: e.permalink ?? null,
        postedAt: e.posted_at ?? e.date ?? null,
      }))
    : [
        {
          domain: arg("domain"),
          contentKey: arg("content-key"),
          permalink: arg("permalink", null),
          postedAt: arg("posted-at", new Date().toISOString()),
        },
      ];

  if (!fromLog && (!rows[0].domain || !rows[0].contentKey)) {
    console.error("[error] --domain と --content-key は必須 (--from-log でログ一括回収)");
    process.exit(2);
  }

  const tally = { insert: 0, update: 0, skip: 0 };
  for (const row of rows) {
    // 1 件ごとに読み直す。同一 run 内で連続 insert したとき、直前の結果を見ずに
    // 判定すると同じ content_key が二重に入る。
    const existing = store.loadAll();
    const decision = apply(row, existing);
    tally[decision.action] += 1;
    const label = `${row.domain}/${row.contentKey}`;
    if (decision.action !== "skip") {
      console.log(`  [${decision.action}] ${label} (${decision.reason})`);
    }
  }

  console.log(
    `[done]${DRY_RUN ? " (dry-run)" : ""} insert ${tally.insert} / update ${tally.update} / skip ${tally.skip}`,
  );
}

main();
