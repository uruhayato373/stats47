#!/usr/bin/env node
/**
 * fix-broken-internal-links.mjs — 壊れている内部リンクを置換表に従って決定的に是正する
 *
 * 入力: R2 の公開記事 (既定) / 置換表 `.claude/scripts/blog/data/broken-link-remap.json`
 * 出力: `.local/blog-linkfix/out/<slug>/article.md` (変更があった記事のみ) + レポート
 *
 * 変換は 2 種類だけ。散文は一切変更しない。
 *   remap  (to: "/ranking/xxx") … リンク先だけ差し替える。アンカーテキストはそのまま
 *   unlink (to: null)           … markdown リンクはテキストだけ残す / source-link カードは行ごと削除
 *
 * 「意味の合う実在ページが無いのに近そうな所へ飛ばす」ことはしない (置換表の reason を参照)。
 *
 * 使い方:
 *   node .claude/scripts/blog/fix-broken-internal-links.mjs            # dry-run
 *   node .claude/scripts/blog/fix-broken-internal-links.mjs --apply
 *   node .claude/scripts/blog/fix-broken-internal-links.mjs --apply --slug a,b
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const REMAP_FILE = path.join(ROOT, ".claude/scripts/blog/data/broken-link-remap.json");
const SRC_CACHE = path.join(ROOT, ".local/blog-linkfix/_src");
const OUT_DIR = path.join(ROOT, ".local/blog-linkfix/out");
const CONCURRENCY = 8;

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const slugIdx = argv.indexOf("--slug");
const SLUG_FILTER =
  slugIdx >= 0 && argv[slugIdx + 1] ? new Set(argv[slugIdx + 1].split(",").map((s) => s.trim())) : null;

const REMAP = JSON.parse(fs.readFileSync(REMAP_FILE, "utf8")).remap;
const TARGETS = Object.keys(REMAP).filter((k) => !k.startsWith("_"));
/** 削除跡の目印 (本文に現れない制御文字)。最後に周囲の改行ごと畳む */
const SENTINEL = "\uE000";

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
}
/** 相対・絶対 (https://stats47.jp/...) の両方にマッチする href パターン */
function hrefPattern(href) {
  return `(?:https?://(?:www\\.)?stats47\\.jp)?${escapeRe(href)}/?`;
}

/** 1 記事を変換する。戻り値 {content, changes[]} */
export function fixArticle(content) {
  let out = content;
  const changes = [];

  for (const href of TARGETS) {
    const to = REMAP[href].to;
    const hp = hrefPattern(href);

    // ① source-link カード (削除時は前後の改行を触らず番兵を置き、最後に局所的に詰める)
    const cardRe = new RegExp(`[ \\t]*<source-link\\s+href="${hp}"[^>]*>[\\s\\S]*?</source-link>[ \\t]*`, "g");
    out = out.replace(cardRe, (m) => {
      if (to) {
        changes.push({ href, to, kind: "card-remap" });
        return m.replace(new RegExp(`href="${hp}"`), `href="${to}"`);
      }
      changes.push({ href, to: null, kind: "card-remove" });
      return SENTINEL;
    });

    // ② markdown リンク
    const mdRe = new RegExp(`\\[([^\\]]*)\\]\\(${hp}\\)`, "g");
    out = out.replace(mdRe, (m, text) => {
      if (to) {
        changes.push({ href, to, kind: "link-remap" });
        return `[${text}](${to})`;
      }
      changes.push({ href, to: null, kind: "link-unlink" });
      return text;
    });
  }

  if (changes.some((c) => c.kind === "link-unlink")) {
    // unlink で「あわせて見る:」行のリンクが全て消えた場合、案内文だけが残ると意味を成さないので行ごと削除。
    // 1 本でもリンクが残っていれば、生き残ったセグメントだけを " / " で繋ぎ直す。
    out = out.replace(/^あわせて見る:[^\n]*$/gm, (line) => {
      const kept = line
        .replace(/^あわせて見る:\s*/, "")
        .split(" / ")
        .map((seg) => seg.trim())
        .filter((seg) => /\[[^\]]*\]\(\//.test(seg));
      return kept.length ? `あわせて見る: ${kept.join(" / ")}` : SENTINEL;
    });
  }

  // 削除跡 (番兵) の周囲だけを詰める。元から 3 連改行のある記事があるので全体置換はしない。
  if (out.includes(SENTINEL)) {
    out = out
      .replace(new RegExp(`\\n{2,}${SENTINEL}\\n{2,}`, "g"), "\n\n") // 段落として独立していた → 空行 1 つ
      .replace(new RegExp(`\\n${SENTINEL}\\n`, "g"), "\n") // 行として存在していた → 行ごと消す
      .replace(new RegExp(`^${SENTINEL}\\n?|\\n?${SENTINEL}$`, "g"), "") // 先頭・末尾
      .replace(new RegExp(SENTINEL, "g"), "");
  }
  return { content: out, changes };
}

async function fetchArticle(slug) {
  const cached = path.join(SRC_CACHE, `${slug}.md`);
  if (fs.existsSync(cached)) return fs.readFileSync(cached, "utf8");
  const res = await fetch(`${R2_BASE}/app/blog/${slug}/article.md`, {
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return null;
  const body = await res.text();
  fs.mkdirSync(SRC_CACHE, { recursive: true });
  fs.writeFileSync(cached, body);
  return body;
}

/**
 * 置換先が live で到達可能か実測する。
 * KNOWN_RANKING_KEYS に載っていても R2 データが無く soft 404 になるキーが実在するため
 * (例: fiscal-strength-index)、オフラインの集合判定では不十分。--apply の前に必ず通す。
 */
async function verifyTargets() {
  const SITE = process.env.SITE_ORIGIN || "https://stats47.jp";
  const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
  const targets = [...new Set(TARGETS.map((k) => REMAP[k].to).filter(Boolean))];
  const bad = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (i < targets.length) {
        const t = targets[i++];
        try {
          const res = await fetch(`${SITE}${t}`, {
            headers: { "user-agent": UA },
            signal: AbortSignal.timeout(25000),
          });
          const body = await res.text();
          const title = (body.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
          if (res.status !== 200 || /見つかりません/.test(title)) {
            bad.push(`${t} — ${res.status !== 200 ? `HTTP ${res.status}` : "soft 404"}`);
          }
        } catch (e) {
          bad.push(`${t} — 取得失敗: ${e.message}`);
        }
      }
    }),
  );
  console.log(`置換先の live 検証: ${targets.length} 件中 到達不可 ${bad.length} 件`);
  if (bad.length) {
    bad.forEach((b) => console.error(`  NG ${b}`));
    throw new Error("到達できない置換先があります。broken-link-remap.json を修正してください");
  }
}

async function main() {
  if (APPLY) await verifyTargets();
  const allRes = await fetch(`${R2_BASE}/app/blog/all.json`, { signal: AbortSignal.timeout(30000) });
  const all = JSON.parse(await allRes.text());
  const list = (Array.isArray(all) ? all : all.articles || []).filter((a) => a.published !== false);
  let slugs = list.map((a) => a.slug);
  if (SLUG_FILTER) slugs = slugs.filter((s) => SLUG_FILTER.has(s));

  const report = [];
  const byReason = {};
  let i = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < slugs.length) {
        const slug = slugs[i++];
        const body = await fetchArticle(slug);
        if (!body) continue;
        const { content, changes } = fixArticle(body);
        if (!changes.length) continue;
        for (const c of changes) {
          const k = `${c.href} → ${c.to ?? "(リンク解除)"}`;
          byReason[k] = (byReason[k] || 0) + 1;
        }
        report.push({ slug, changes });
        if (APPLY) {
          const dir = path.join(OUT_DIR, slug);
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, "article.md"), content);
        }
      }
    }),
  );

  report.sort((a, b) => b.changes.length - a.changes.length);
  console.log(`mode   : ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`対象   : ${slugs.length} 記事 / 変更あり ${report.length} 記事`);
  console.log(`置換数 : ${report.reduce((s, r) => s + r.changes.length, 0)} 箇所\n`);
  console.log("| 置換 | 件数 |");
  console.log("|---|---:|");
  for (const [k, v] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
    console.log(`| ${k} | ${v} |`);
  }
  console.log(`\n変更記事: ${report.map((r) => r.slug).join(", ")}`);
  if (APPLY) console.log(`\n出力: ${path.relative(ROOT, OUT_DIR)}/<slug>/article.md`);
  else console.log(`\n--apply で ${path.relative(ROOT, OUT_DIR)} に書き出します`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e.stack || e.message || e);
    process.exit(1);
  });
}
