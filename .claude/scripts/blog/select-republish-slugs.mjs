#!/usr/bin/env node
/**
 * docs/21 outbox から **公開 (新規 or 再公開) が要る slug** を stdout に 1 行ずつ出す。
 *
 * blog-auto-publish.yml の reconcile から呼ばれる。旧実装は「配信 all.json に
 * 未掲載か」だけを見ており、**改稿版 (既 live の記事を brushup した新版) を
 * 構造的に拾えなかった**。pruner は内容差分を見て正しく保持していたため、
 * 改稿版は outbox に溜まる一方で永久に公開されない状態だった (2026-08-03 検出)。
 *
 * これはブログ是正ループ (`/brushup-blog --target queue`) の出力がすべて
 * 通る経路なので、塞がっていると是正キュー (pending 188) の成果が本番に届かない。
 *
 * 判定は pruner と同じ `lib/outbox-r2.mjs` を使う。prune (消す) と publish (出す) は
 * 裏表で、片方だけがズレると同じ事故が再発する。
 *
 * 使い方:
 *   node .claude/scripts/blog/select-republish-slugs.mjs [--json] [--limit N]
 *     --json   状態つきで JSON 出力 (診断用)
 *     --limit  出力する slug 数の上限 (既定なし。workflow 側の MAX_PUBLISH とは独立)
 *   R2_PUBLIC_FETCH_URL=... で正典判定先を上書き可
 *
 * 正典: .claude/rules/blog-data-schema.md §0
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_R2_BASE,
  classifyAgainstLive,
  fetchR2Article,
  getPublished,
  needsPublish,
} from "./lib/outbox-r2.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUTBOX_REL = "docs/21_ブログ記事原稿";
const OUTBOX = join(PROJECT_ROOT, OUTBOX_REL);
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || DEFAULT_R2_BASE;
const CONCURRENCY = 6;

const asJson = process.argv.includes("--json");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    }),
  );
  return out;
}

async function main() {
  if (!existsSync(OUTBOX)) {
    if (asJson) console.log(JSON.stringify({ base: R2_BASE, entries: [] }, null, 2));
    return;
  }

  const slugs = readdirSync(OUTBOX, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((s) => existsSync(join(OUTBOX, s, "article.md")))
    .sort();

  const entries = await mapLimit(slugs, CONCURRENCY, async (slug) => {
    const articlePath = join(OUTBOX, slug, "article.md");
    const published = getPublished(articlePath);
    // published:true 以外は R2 を叩かない (作業中ドラフトで無駄な fetch をしない)
    if (published !== true) return { slug, published, state: "draft" };
    const localBody = readFileSync(articlePath, "utf8");
    const liveBody = await fetchR2Article(slug, R2_BASE);
    return {
      slug,
      published,
      state: classifyAgainstLive({ published, localBody, liveBody }),
    };
  });

  const targets = entries.filter((e) => needsPublish(e.state)).slice(0, LIMIT);

  if (asJson) {
    console.log(JSON.stringify({ base: R2_BASE, entries, targets: targets.map((t) => t.slug) }, null, 2));
    return;
  }
  for (const t of targets) console.log(t.slug);
}

main().catch((err) => {
  // 失敗時に空を出すと「公開対象なし」と区別できない。exit != 0 で呼び出し側に伝える
  console.error(`[select-republish] 失敗: ${err?.message ?? err}`);
  process.exit(1);
});
