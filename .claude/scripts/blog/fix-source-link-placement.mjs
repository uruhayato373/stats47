#!/usr/bin/env node
/**
 * fix-source-link-placement — ブログ記事の <source-link> カード配置を決定的に是正する
 *
 * 背景 (2026-07-24): /blog/black-tea-income-gap でランキングカードが 3 連続表示され
 * 「関係のないリンク」に見える、というユーザー報告。実測すると公開 424 記事のうち 167 記事
 * (42%) が同種のアンチパターンを持っていた。既存 lint は「記事末尾に 2 個以上」しか見ておらず
 * 本文中盤のクラスタ・重複・図なし配置をすり抜けていた。
 *
 * 正典: .claude/rules/blog-quality-standards.md「source-link の配置」
 *
 * 変換ルール (散文は一切変更しない):
 *   R1 重複除去   同一 /ranking/<key> へのカードの 2 回目以降を削除 (初出は残す)
 *   R2 図なし節   H2 セクション内に図が 0 枚ならカードをインラインテキストリンクへ格下げ
 *   R3 クラスタ   隣接カードが 2 本以上残る場合、図と照合して 1 本だけカードで残し他を格下げ
 *
 * 格下げ = 削除ではない。`あわせて見る: [ラベル](/ranking/key)` の 1 行に集約する
 * (回遊導線は保つ。quality-gate の internalLinks は markdown リンクを数えるため減らない)。
 *
 * 使い方:
 *   node .claude/scripts/blog/fix-source-link-placement.mjs                # dry-run (既定)
 *   node .claude/scripts/blog/fix-source-link-placement.mjs --apply        # .local/ へ変換後 md を書き出し
 *   node .claude/scripts/blog/fix-source-link-placement.mjs --slug a,b --verbose
 *   node .claude/scripts/blog/fix-source-link-placement.mjs --overrides o.json --apply
 *
 * overrides.json: { "<slug>": { "<ranking-key>": "keep" | "demote" | "delete" } }
 *   R3 の keep/demote 判定を人が上書きする逃げ道 (誤判定の個別修正用)。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const METRICS_DIR = path.join(PROJECT_ROOT, "packages/data-configs/src/metrics");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const DEFAULT_SRC = path.join(PROJECT_ROOT, ".local/blog-srclink-fix/_src");
const DEFAULT_OUT = path.join(PROJECT_ROOT, ".local/blog-srclink-fix/out");
const DEFAULT_REPORT = path.join(PROJECT_ROOT, ".local/blog-srclink-fix/report.json");

// ---------------------------------------------------------------- args

function parseArgs(argv) {
  const a = {
    apply: false,
    slugs: null,
    limit: null,
    verbose: false,
    srcDir: DEFAULT_SRC,
    outDir: DEFAULT_OUT,
    report: DEFAULT_REPORT,
    overrides: {},
    refetch: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === "--apply") a.apply = true;
    else if (v === "--dry-run") a.apply = false;
    else if (v === "--verbose") a.verbose = true;
    else if (v === "--refetch") a.refetch = true;
    else if (v === "--slug") a.slugs = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (v === "--limit") a.limit = Number(argv[++i]);
    else if (v === "--src-dir") a.srcDir = path.resolve(argv[++i]);
    else if (v === "--out-dir") a.outDir = path.resolve(argv[++i]);
    else if (v === "--report") a.report = path.resolve(argv[++i]);
    else if (v === "--overrides") a.overrides = JSON.parse(fs.readFileSync(argv[++i], "utf8"));
  }
  return a;
}

// ---------------------------------------------------------------- metric titles

const titleCache = new Map();
function metricTitle(key) {
  if (titleCache.has(key)) return titleCache.get(key);
  const p = path.join(METRICS_DIR, `${key}.ts`);
  let t = null;
  if (fs.existsSync(p)) {
    const m = fs.readFileSync(p, "utf8").match(/"?title"?:\s*"([^"]+)"/);
    if (m) t = m[1];
  }
  titleCache.set(key, t);
  return t;
}

// ---------------------------------------------------------------- parsing

function splitFrontmatter(md) {
  const m = md.match(/^---\n[\s\S]*?\n---\n?/);
  return m ? { fm: m[0], body: md.slice(m[0].length) } : { fm: "", body: md };
}

/** H2 セクションに分割 (先頭の導入部も 1 セクションとして扱う) */
function findSections(body) {
  const secs = [];
  const re = /^## .*$/gm;
  const starts = [];
  let m;
  while ((m = re.exec(body)) !== null) starts.push({ index: m.index, heading: m[0] });
  if (starts.length === 0 || starts[0].index > 0) {
    secs.push({ start: 0, end: starts.length ? starts[0].index : body.length, heading: "" });
  }
  for (let i = 0; i < starts.length; i++) {
    secs.push({
      start: starts[i].index,
      end: i + 1 < starts.length ? starts[i + 1].index : body.length,
      heading: starts[i].heading,
    });
  }
  for (const s of secs) s.text = body.slice(s.start, s.end);
  return secs;
}

const LINK_RE = /<source-link\s+href="(\/ranking\/[^"]+)"\s*>([\s\S]*?)<\/source-link>/g;

function findLinks(body, sections) {
  const links = [];
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(body)) !== null) {
    const start = m.index;
    const end = m.index + m[0].length;
    const sec = sections.find((s) => start >= s.start && start < s.end) ?? sections[0];
    links.push({
      start,
      end,
      raw: m[0],
      href: m[1],
      key: m[1].replace(/^\/ranking\//, "").replace(/\/$/, ""),
      label: m[2].trim(),
      section: sec,
    });
  }
  return links;
}

/** その行全体 (行頭〜改行含む) の範囲へ拡張する */
function lineRange(body, start, end) {
  let s = body.lastIndexOf("\n", start - 1) + 1;
  let e = body.indexOf("\n", end);
  e = e === -1 ? body.length : e + 1;
  return { s, e };
}

function countFigures(text) {
  return (text.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
}

/**
 * 隣接ブロック (カード同士が空白のみで隔てられている塊) に links をまとめる。
 * 「関係のないリンクが並んでいる」という読者体験の単位はこのブロック。
 */
function groupAdjacent(body, links) {
  const blocks = [];
  let cur = null;
  for (const l of links) {
    if (cur) {
      const between = body.slice(cur[cur.length - 1].end, l.start);
      if (/^\s*$/.test(between)) {
        cur.push(l);
        continue;
      }
      blocks.push(cur);
    }
    cur = [l];
  }
  if (cur) blocks.push(cur);
  return blocks;
}

// ---------------------------------------------------------------- R3 scoring

/**
 * そのセクションに現れる他の ranking key と共有しないトークン。
 * 「tea」のような共有語で black-tea の図に green-tea を紐づける誤判定を防ぐため、
 * 比較対象は同一セクションの全 key (削除予定のものも含む) にする。
 */
function distinctiveTokens(key, sectionKeys) {
  const own = key.split("-").filter((t) => t.length > 2);
  const others = new Set(sectionKeys.filter((k) => k !== key).flatMap((k) => k.split("-")));
  return own.filter((t) => !others.has(t));
}

/**
 * セクションの図・見出しと照合してカードの妥当性を採点する。
 * 図の alt / 見出しに指標名 (日本語 title) が出る = そのセクションの主題データ (最強シグナル)。
 * 英語 key のパス照合はノイズが多いので、識別語が「すべて」図パスに出る場合のみ次点で採る。
 */
function scoreCardFit(link, sectionKeys) {
  const figs = [...link.section.text.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
  const title = metricTitle(link.key);
  let score = 0;
  if (title) {
    for (const f of figs) if (f[1].includes(title)) score = Math.max(score, 10);
    if (link.section.heading.includes(title)) score = Math.max(score, 8);
  }
  const tokens = distinctiveTokens(link.key, sectionKeys);
  if (tokens.length) {
    for (const f of figs) {
      if (tokens.every((t) => f[2].includes(t))) score = Math.max(score, 4);
    }
  }
  return score;
}

// ---------------------------------------------------------------- demote rendering

/** カードのアンカーテキストを、本文中インラインリンクとして自然な語に正規化する */
function demoteLabel(link) {
  const title = metricTitle(link.key);
  if (title) return `${title}ランキング`;
  let t = link.label.replace(/\s+/g, "");
  t = t.replace(/^47都道府県の/, "");
  t = t.replace(/(を|で)?(もっと|詳しく)?(見る|チェックする|確認する)$/, "");
  return t || link.key;
}

function renderDemoteLine(links) {
  const body = links.map((l) => `[${demoteLabel(l)}](${l.href})`).join(" / ");
  return `あわせて見る: ${body}`;
}

// ---------------------------------------------------------------- transform

export function transformArticle(md, opts = {}) {
  const overrides = opts.overrides || {};
  const { fm, body } = splitFrontmatter(md);
  const sections = findSections(body);
  const links = findLinks(body, sections);
  const actions = [];
  if (links.length === 0) return { changed: false, output: md, actions, stats: {} };

  // --- R1: 同一 href の 2 回目以降を削除
  const seen = new Set();
  for (const l of links) {
    if (seen.has(l.href)) {
      l.decision = "delete";
      l.reason = "dup-ranking-link";
    } else {
      seen.add(l.href);
      l.decision = "keep";
    }
  }

  // --- R2: 図が 0 枚のセクションのカードは格下げ
  for (const l of links) {
    if (l.decision !== "keep") continue;
    if (countFigures(l.section.text) === 0) {
      l.decision = "demote";
      l.reason = "no-figure-section";
    }
  }

  // --- R3: 隣接クラスタに keep が 2 本以上残るなら、図と最も合う 1 本だけカードで残す
  const blocks = groupAdjacent(body, links);
  for (const block of blocks) {
    const kept = block.filter((l) => l.decision === "keep");
    if (kept.length < 2) continue;
    const sectionKeys = [...new Set(links.filter((l) => l.section === block[0].section).map((l) => l.key))];
    const scored = kept.map((l) => ({ l, score: scoreCardFit(l, sectionKeys) }));
    const best = scored.reduce((a, b) => (b.score > a.score ? b : a), scored[0]);
    for (const { l, score } of scored) {
      if (l === best.l && best.score > 0) {
        l.fitScore = score;
        continue;
      }
      l.decision = "demote";
      l.reason = "adjacent-cluster";
      l.fitScore = score;
    }
  }

  // --- overrides (人による個別上書き)
  for (const l of links) {
    const o = overrides[l.key];
    if (o && ["keep", "demote", "delete"].includes(o)) {
      l.decision = o;
      l.reason = `${l.reason ?? "-"}+override`;
    }
  }

  // --- 編集適用
  // 格下げリンクは「セクション単位で 1 行」に集約する。ブロックごとに行を作ると
  // 「あわせて見る:」が節内に何行も並び、カードの羅列を別の羅列に置き換えるだけになるため。
  // 集約行は、その節で最後に格下げが起きたブロックの位置に置く (読み順を大きく変えない)。
  const lastDemotedBlockOfSection = new Map();
  blocks.forEach((block, i) => {
    if (block.some((l) => l.decision === "demote")) lastDemotedBlockOfSection.set(block[0].section, i);
  });

  let out = body;
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (block.every((l) => l.decision === "keep")) continue;
    const first = lineRange(body, block[0].start, block[0].end);
    const last = lineRange(body, block[block.length - 1].start, block[block.length - 1].end);
    const parts = block.filter((l) => l.decision === "keep").map((l) => l.raw);
    if (lastDemotedBlockOfSection.get(block[0].section) === i) {
      const demotedInSection = links.filter(
        (l) => l.section === block[0].section && l.decision === "demote",
      );
      if (demotedInSection.length) parts.push(renderDemoteLine(demotedInSection));
    }
    const replacement = parts.length ? parts.join("\n\n") + "\n" : "";
    const prefix = out.slice(0, first.s);
    let suffix = out.slice(last.e);
    // 行ごと削除すると前後の空行が連結して 3 連改行になる。1 つ詰めて元の段落間隔に戻す。
    if (!replacement && prefix.endsWith("\n\n") && suffix.startsWith("\n")) suffix = suffix.slice(1);
    out = prefix + replacement + suffix;
  }

  for (const l of links) {
    if (l.decision === "keep") continue;
    actions.push({
      key: l.key,
      decision: l.decision,
      reason: l.reason,
      fitScore: l.fitScore ?? null,
      heading: l.section.heading.replace(/^##\s*/, "").slice(0, 40),
      figures: countFigures(l.section.text),
    });
  }

  const changed = actions.length > 0;
  return {
    changed,
    output: changed ? fm + out : md,
    actions,
    stats: {
      links: links.length,
      deleted: actions.filter((a) => a.decision === "delete").length,
      demoted: actions.filter((a) => a.decision === "demote").length,
    },
  };
}

// ---------------------------------------------------------------- io

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function loadSlugs() {
  const all = JSON.parse(await fetchText(`${R2_BASE}/app/blog/all.json`));
  const arr = Array.isArray(all) ? all : all.articles || all.items || [];
  // published:false のエントリは R2 に article.md が無いことがある (旧 mdx 形式・取得すると 404)。
  // all.json 側の整理は .claude/todo/05_機能バックログ.md「非公開記事が blog all.json に混在」で追跡。
  return arr.filter((a) => a.published !== false).map((a) => a.slug).filter(Boolean);
}

async function loadArticle(slug, srcDir, refetch) {
  const cached = path.join(srcDir, `${slug}.md`);
  if (!refetch && fs.existsSync(cached)) return fs.readFileSync(cached, "utf8");
  const md = await fetchText(`${R2_BASE}/app/blog/${slug}/article.md`);
  fs.mkdirSync(srcDir, { recursive: true });
  fs.writeFileSync(cached, md);
  return md;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        try {
          out[idx] = await fn(items[idx]);
        } catch (e) {
          out[idx] = { slug: items[idx], error: String(e.message || e) };
        }
      }
    }),
  );
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let slugs = args.slugs ?? (await loadSlugs());
  if (args.limit) slugs = slugs.slice(0, args.limit);

  const results = await mapLimit(slugs, 16, async (slug) => {
    const md = await loadArticle(slug, args.srcDir, args.refetch);
    const overrides = args.overrides[slug] || {};
    const r = transformArticle(md, { overrides });
    if (r.changed && args.apply) {
      const dir = path.join(args.outDir, slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "article.md"), r.output);
    }
    return { slug, ...r, output: undefined };
  });

  const ok = results.filter((r) => !r.error);
  const errors = results.filter((r) => r.error);
  const changed = ok.filter((r) => r.changed);
  const totals = changed.reduce(
    (a, r) => ({ deleted: a.deleted + r.stats.deleted, demoted: a.demoted + r.stats.demoted }),
    { deleted: 0, demoted: 0 },
  );
  const byReason = {};
  for (const r of changed)
    for (const a of r.actions) byReason[a.reason] = (byReason[a.reason] || 0) + 1;

  console.log(`mode        : ${args.apply ? "APPLY (.local へ書き出し)" : "DRY-RUN"}`);
  console.log(`対象記事    : ${ok.length} (取得失敗 ${errors.length})`);
  console.log(`変更あり    : ${changed.length} 記事`);
  console.log(`  カード削除: ${totals.deleted} 本`);
  console.log(`  格下げ    : ${totals.demoted} 本`);
  console.log(`  内訳      : ${JSON.stringify(byReason)}`);
  if (errors.length) console.log(`  errors    : ${errors.map((e) => e.slug).join(", ")}`);

  if (args.verbose) {
    console.log("\n--- 変更明細 ---");
    for (const r of changed) {
      console.log(`\n■ ${r.slug} (links=${r.stats.links})`);
      for (const a of r.actions)
        console.log(
          `   ${a.decision.padEnd(6)} ${a.reason.padEnd(18)} fit=${String(a.fitScore ?? "-").padStart(2)} figs=${a.figures} ${a.key}  «${a.heading}»`,
        );
    }
  }

  fs.mkdirSync(path.dirname(args.report), { recursive: true });
  fs.writeFileSync(
    args.report,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), mode: args.apply ? "apply" : "dry-run", totals, byReason, results: changed },
      null,
      2,
    ),
  );
  console.log(`\nreport      : ${path.relative(PROJECT_ROOT, args.report)}`);
  if (args.apply) console.log(`out         : ${path.relative(PROJECT_ROOT, args.outDir)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
