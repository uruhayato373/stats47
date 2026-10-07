/**
 * critic-findings — blog-critic の指摘を台帳に貯め、繰り返す型を規約・gate への格上げ候補にする (純粋関数)。
 *
 * なぜ要るか (2026-10-07): review.md は公開時に outbox ごと消え、REVISE の review.md は再審で上書きされる。
 * そのため「同じ型の指摘が何本の記事で繰り返したか」が残らず、writer の規約にも gate にも戻らなかった
 * (図の年の書き直し 22 本で、関連記事の紹介・地域のくくり・相関の向きなどが毎回 critic の目視で見つかった)。
 *
 * 型の語彙としきい値の正本: `.claude/config/critic-finding-types.json`
 * 記録: record-critic-findings.mjs (critic が review.md を書いた直後 + 公開時の outbox 掃除の直前)
 * 集計と起票: critic-findings-digest.mjs (日次の blog-remediation-daily)
 */

import { createHash } from "node:crypto";

const FINDING_LINE = /^\s*[-*]\s*\*{0,2}\[(BLOCK|BLOCKER|MAJOR|MINOR)\](?:\[型[:：]\s*([a-z-]+)\])?\*{0,2}\s*(.+)$/i;
const SUMMARY_MAX = 120;
const SERIOUS = new Set(["BLOCK", "MAJOR"]);
/** 型を決められない指摘。格上げの対象にしない。 */
const UNPROMOTABLE = new Set(["unclassified", "other"]);

function frontmatter(md) {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  const fields = {};
  if (!match) return fields;
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return fields;
}

/** 指摘の本文から 1 文目を取り出す (台帳は傾向を数えるためのもので、全文は git の review.md 履歴にある)。 */
function summarize(text) {
  const first = text.replace(/\s+/g, " ").split(/(?<=。)/)[0].trim();
  return first.length > SUMMARY_MAX ? `${first.slice(0, SUMMARY_MAX - 1)}…` : first;
}

/**
 * review.md を読み、指摘を行ごとに返す。`## 指摘` 節の箇条書きだけを見る。
 * @param {string} md
 * @param {{ slug?: string, knownTypes?: string[] }} [opts]
 */
export function parseReview(md, opts = {}) {
  const fm = frontmatter(md);
  const known = new Set(opts.knownTypes ?? []);
  const section = md.split(/^## 指摘\s*$/m)[1]?.split(/^## /m)[0] ?? "";
  const findings = [];
  for (const line of section.split("\n")) {
    const match = line.match(FINDING_LINE);
    if (!match) continue;
    const severity = match[1].toUpperCase() === "BLOCKER" ? "BLOCK" : match[1].toUpperCase();
    const declared = match[2]?.toLowerCase();
    const type = declared && (known.size === 0 || known.has(declared)) ? declared : "unclassified";
    findings.push({ severity, type, summary: summarize(match[3]) });
  }
  return {
    slug: opts.slug ?? fm.slug ?? null,
    mode: fm.mode ?? null,
    verdict: (fm.verdict ?? "").toUpperCase() || null,
    date: fm.date ?? null,
    findings,
  };
}

/** 台帳の 1 行。同じ review.md を何度記録しても同じ key になる (重複を書かない)。 */
export function toLedgerRows(review) {
  return review.findings.map((finding, index) => {
    const key = createHash("sha1")
      .update([review.slug, review.date, review.mode, index, finding.severity, finding.summary].join("|"))
      .digest("hex")
      .slice(0, 16);
    return { key, date: review.date, slug: review.slug, mode: review.mode, verdict: review.verdict, ...finding };
  });
}

/**
 * 型ごとに、窓の中で BLOCK/MAJOR が出た記事の数を数える。promotedAt より前の指摘は数えない
 * (規約か gate に入れた型は、入れた後に再発した分だけを見る)。
 * @param {Array<{date:string, slug:string, severity:string, type:string, summary:string}>} rows
 * @param {{ today: string, windowDays: number, types: Record<string, {promotedAt?: string}> }} config
 */
export function aggregateByType(rows, config) {
  const since = new Date(`${config.today}T00:00:00Z`);
  since.setUTCDate(since.getUTCDate() - config.windowDays);
  const sinceIso = since.toISOString().slice(0, 10);
  const byType = new Map();
  for (const row of rows) {
    if (!row.date || row.date < sinceIso || !SERIOUS.has(row.severity)) continue;
    const promotedAt = config.types[row.type]?.promotedAt;
    if (promotedAt && row.date <= promotedAt) continue;
    const entry = byType.get(row.type) ?? { type: row.type, findings: 0, slugs: new Set(), examples: [] };
    entry.findings += 1;
    entry.slugs.add(row.slug);
    if (entry.examples.length < 5) entry.examples.push({ slug: row.slug, date: row.date, summary: row.summary });
    byType.set(row.type, entry);
  }
  return [...byType.values()]
    .map((entry) => ({ ...entry, articles: entry.slugs.size, slugs: [...entry.slugs].sort() }))
    .sort((a, b) => b.articles - a.articles || b.findings - a.findings || a.type.localeCompare(b.type));
}

export function cardIdForType(type) {
  return `CRITIC-PATTERN-${type.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`;
}

/**
 * しきい値を超えた型ごとに backlog カードを 1 枚作る。同じ型のカードが開いていれば作らない。
 * 型を決められない指摘 (unclassified / other) は格上げの対象にしない。
 */
export function planPatternCards(aggregate, { openIds, today, minArticles, types, ledgerPath }) {
  const open = new Set(openIds);
  return aggregate
    .filter((entry) => entry.articles >= minArticles && !UNPROMOTABLE.has(entry.type))
    .filter((entry) => !open.has(cardIdForType(entry.type)))
    .map((entry) => {
      const id = cardIdForType(entry.type);
      const label = types[entry.type]?.label ?? entry.type;
      const examples = entry.examples
        .map((example) => `  - ${example.date} ${example.slug}: ${example.summary}`)
        .join("\n");
      const markdown = [
        `### [${id}] critic の指摘「${label}」が ${entry.articles} 本の記事で繰り返した。writer の規約か gate に入れる`,
        `タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:${today}] [領域:サイト]`,
        "",
        `- **事象**: 直近の窓で、blog-critic が型「${label}」(\`${entry.type}\`) の BLOCK/MAJOR を ${entry.articles} 本の記事で ${entry.findings} 件出した。critic の目視でしか見つかっていない。例:`,
        examples,
        "- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。",
        `- **完了条件**: 検査か規約が入り、\`.claude/config/critic-finding-types.json\` の \`${entry.type}\` に \`promotedAt: "<入れた日>"\` を書いた。`,
        `- 起票元: \`critic-findings-digest.mjs\` (台帳 \`${ledgerPath}\`)`,
      ].join("\n");
      return { id, tier: "🟡", markdown };
    });
}

/** 人が 10 秒で読む要約。 */
export function renderLatest(aggregate, { today, windowDays, minArticles, types, totalRows }) {
  const lines = [
    "# critic の指摘の型 (直近の傾向)",
    "",
    `- 集計日: ${today} / 窓: 直近 ${windowDays} 日 / 起票のしきい値: BLOCK・MAJOR が ${minArticles} 本以上の記事`,
    `- 台帳の行数: ${totalRows}`,
    "",
  ];
  if (aggregate.length === 0) {
    lines.push("窓の中に BLOCK・MAJOR の指摘はありません。");
    return `${lines.join("\n")}\n`;
  }
  for (const entry of aggregate) {
    const unpromotable = UNPROMOTABLE.has(entry.type);
    const label = entry.type === "unclassified" ? "型なし" : (types[entry.type]?.label ?? entry.type);
    const flag = unpromotable
      ? " (型が決まらないので起票しない。review.md の指摘に [型:<key>] を付ける)"
      : entry.articles >= minArticles
        ? " ← 起票対象"
        : "";
    lines.push(`- **${label}** (\`${entry.type}\`): 記事 ${entry.articles} 本 / 指摘 ${entry.findings} 件${flag}`);
  }
  return `${lines.join("\n")}\n`;
}
