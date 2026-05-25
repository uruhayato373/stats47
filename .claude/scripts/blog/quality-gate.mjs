#!/usr/bin/env node
/**
 * ブログ記事 brushup 後の自動品質ゲート。
 *
 * auto-merge 対応のため、機械的にチェック可能な品質基準を全て script で検証する。
 * 1 つでも失敗したら exit 1 (skip 推奨)。
 *
 * Usage:
 *   node .claude/scripts/blog/quality-gate.mjs <slug>
 *
 * exit code:
 *   0 = pass (auto-merge OK)
 *   1 = fail (人間レビュー必要)
 *   2 = file not found
 *
 * 出力 (stdout JSON):
 *   { "pass": true|false, "checks": {...}, "warnings": [...], "blockers": [...] }
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const slug = process.argv[2];
if (!slug) {
  console.error("usage: node quality-gate.mjs <slug>");
  process.exit(1);
}

const articlePath = path.join(PROJECT_ROOT, ".local/r2/app/blog", slug, "article.md");
if (!fs.existsSync(articlePath)) {
  console.error(`[error] article not found: ${articlePath}`);
  process.exit(2);
}

const content = fs.readFileSync(articlePath, "utf8");

// ============================================================================
// NG パターン (rice-harvest 失敗事例より学習)
// ============================================================================
// agent が機械的に curiosity gap を作ったときに陥りやすいパターン。
// これらの phrase は本質的価値を伴わない sensationalism の典型。
const NG_PATTERNS = [
  // 数値倍率の sensationalism (X倍格差、X倍差 単独)
  { pattern: /\d+,?\d*\s*倍格差/, name: "X倍格差 (sensationalism)" },
  { pattern: /\d{2,}\s*倍差(?!\s*の|を|は|が|が|・|、)/, name: "X倍差 単独 (sensationalism)" },
  // 主観的・扇情的形容
  { pattern: /驚愕の/, name: "驚愕の (扇情的)" },
  { pattern: /衝撃の/, name: "衝撃の (扇情的)" },
  { pattern: /(ヤバい|やばい)/, name: "ヤバい (口語扇情)" },
  { pattern: /信じられない/, name: "信じられない (扇情的)" },
  { pattern: /最大級/, name: "最大級 (主観的形容、根拠不明)" },
  { pattern: /最大の.*ヤミ/, name: "最大のヤミ (扇情的)" },
  // 単なる事実羅列タイトル化のパターン
  { pattern: /^title:\s*"[^"]*\d+位[^"]*"/m, name: "title 「N位」だけで終わる (curiosity gap 不足)" },
];

// ============================================================================
// 必須要素チェック
// ============================================================================
function countCallouts(text) {
  const matches = text.match(/^>\s*\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]/gm);
  return matches ? matches.length : 0;
}

function countInternalLinks(text) {
  // https://stats47.jp/... 形式 と (/ranking|/areas|...) 形式の両方をカウント
  const absMatches = text.match(/https:\/\/stats47\.jp\/(ranking|areas|category|blog|themes|tag|survey)/g) || [];
  const relMatches = text.match(/\]\(\/(ranking|areas|category|blog|themes|tag|survey)/g) || [];
  return absMatches.length + relMatches.length;
}

function countSvgCharts(text) {
  const matches = text.match(/<svg\s+[^>]*xmlns/g);
  return matches ? matches.length : 0;
}

function getCharCount(text) {
  // frontmatter を除いた本文の文字数
  const body = text.replace(/^---[\s\S]*?\n---\n/, "");
  return body.length;
}

function getH2Count(text) {
  const matches = text.match(/^##\s+\S/gm);
  return matches ? matches.length : 0;
}

function hasSeoTitle(text) {
  return /^seoTitle:\s*["'].+["']/m.test(text);
}

function hasDescription(text) {
  return /^description:\s*["']?.{50,}/m.test(text);
}

function hasDataSource(text) {
  return /## データ出典|## 出典|^- 農林水産省|^- 総務省|^- 厚生労働省|^- 国土交通省|^- e-Stat/m.test(text);
}

// ============================================================================
// Factual cross-check: data/*.json と本文の rank claim を突合 (2026-05-25 追加)
// ============================================================================
// 2026-05-25 検証で発覚した数値捏造 (例: 沖縄 財政力指数 41位→実 35位、奈良 消費支出
// 35位→実 13位) を機械検出するため。data/*.json から rank の ground truth を build し、
// 本文中の「<都道府県> ... N位」を抽出して突合する。

const PREF_NAMES = [
  "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島",
  "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川",
  "新潟", "富山", "石川", "福井", "山梨", "長野",
  "岐阜", "静岡", "愛知", "三重",
  "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山",
  "鳥取", "島根", "岡山", "広島", "山口",
  "徳島", "香川", "愛媛", "高知",
  "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄",
];

// rank-gap/change 表現 (絶対 rank ではない) — 「28位もの乖離」「N位転落」等は skip
const RANK_CONTEXT_SKIP = /(?:もの)?(?:乖離|差(?:が|を|に|は|の|・|、|\s)|の差|格差|落ち|下落|転落|上昇|アップ|ダウン|上昇分|低下分|改善|悪化)/;

// 一人当たり (per capita) は derived ranking で data に直接含まれない → skip
const PER_CAPITA_SKIP = /(?:一人当たり|1人当たり|1人あたり|人口当たり|人口あたり|per\s*capita|人口比)/i;

// article-level: frontmatter (seoTitle / description / subtitle) が per-capita を示すなら per-capita 記事と判定
function isPerCapitaArticle(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return false;
  return PER_CAPITA_SKIP.test(fmMatch[1]);
}

function normalizePref(name) {
  if (typeof name !== "string") return "";
  return name.replace(/(都|府|県)$/, "").trim();
}

function isPrefEntry(item) {
  if (!item || typeof item !== "object") return false;
  const hasArea =
    typeof item.areaName === "string" ||
    typeof item.area_name === "string" ||
    typeof item.prefecture === "string" ||
    typeof item.pref === "string";
  const hasRankOrValue = "rank" in item || "value" in item || "val" in item;
  return hasArea && hasRankOrValue;
}

function extractPrefName(item) {
  return item.areaName || item.area_name || item.prefecture || item.pref || "";
}

function extractRank(item) {
  return typeof item.rank === "number" ? item.rank : null;
}

function extractValue(item) {
  if (typeof item.value === "number") return item.value;
  if (typeof item.val === "number") return item.val;
  return null;
}

function walkAndIndex(node, idx, source, currentLabel) {
  if (Array.isArray(node)) {
    if (node.length > 0 && isPrefEntry(node[0])) {
      for (const item of node) {
        if (!isPrefEntry(item)) continue;
        const pref = normalizePref(extractPrefName(item));
        if (!pref) continue;
        if (!idx[pref]) idx[pref] = [];
        idx[pref].push({
          rank: extractRank(item),
          value: extractValue(item),
          label: currentLabel,
          source,
        });
      }
    } else {
      node.forEach((child) => walkAndIndex(child, idx, source, currentLabel));
    }
  } else if (node && typeof node === "object") {
    for (const [key, val] of Object.entries(node)) {
      let nextLabel = currentLabel;
      if (val && typeof val === "object" && !Array.isArray(val)) {
        if (typeof val.label === "string") nextLabel = val.label;
        else if (typeof val.rankingKey === "string") nextLabel = val.rankingKey;
        else if (typeof val.categoryName === "string") nextLabel = val.categoryName;
        else if (typeof val.category_code === "string") nextLabel = val.category_code;
        else nextLabel = key;
      } else if (Array.isArray(val) && val.length > 0 && isPrefEntry(val[0])) {
        // currentLabel が「rankings/data」等の汎用 key なら上書き、そうでなければ保持
        if (!currentLabel || currentLabel === "rankings" || currentLabel === "data") {
          nextLabel = key;
        }
      }
      walkAndIndex(val, idx, source, nextLabel);
    }
  }
}

function buildGroundTruth(slug) {
  const idx = {};
  const dataDir = path.join(PROJECT_ROOT, ".local/r2/app/blog", slug, "data");
  if (!fs.existsSync(dataDir)) return idx;
  for (const file of fs.readdirSync(dataDir)) {
    if (!file.endsWith(".json")) continue;
    try {
      const json = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
      walkAndIndex(json, idx, file, "");
    } catch {
      // skip malformed JSON
    }
  }
  return idx;
}

// data label に存在しない named ranking (例: 持ち家比率) を citing しているなら skip
function isCitingUnknownRanking(matchText, gt) {
  const labels = new Set();
  for (const facts of Object.values(gt)) {
    for (const f of facts) {
      if (f.label) labels.add(f.label);
    }
  }
  const namedRankRe = /([一-鿿]{2,10}(?:率|指数|比率|割合|度))/;
  const m = matchText.match(namedRankRe);
  if (!m) return false;
  const namedRank = m[1];
  return !Array.from(labels).some((l) => l && l.includes(namedRank));
}

function checkRankClaims(content, gt) {
  const blockers = [];
  if (Object.keys(gt).length === 0) return blockers;
  const body = content.replace(/^---[\s\S]*?\n---\n/, "");
  const prefPattern = PREF_NAMES.join("|");
  const rankRe = new RegExp(
    `(${prefPattern})(?:都|府|県)?[^、。\\n（）()]{0,40}?(\\d+)\\s*位`,
    "g"
  );
  const seenClaims = new Set();
  let m;
  while ((m = rankRe.exec(body)) !== null) {
    const pref = m[1];
    const claimedRank = parseInt(m[2], 10);
    if (claimedRank < 1 || claimedRank > 47) continue;

    // skip: rank-gap や rank-change 表現
    const tailContext = body.slice(m.index + m[0].length, m.index + m[0].length + 30);
    if (RANK_CONTEXT_SKIP.test(tailContext)) continue;
    // skip: N位 が次の pref を修飾 (例: 「東京は2位・福井県の...」)
    const nextPrefRe = new RegExp(`^[・、の/\\s]{0,3}(${prefPattern})(?:都|府|県)?`);
    if (nextPrefRe.test(tailContext)) continue;
    // skip: 一人当たり (per capita) derived ranking (match 内 / 300 chars 前 / 60 chars 後 まで)
    const leadContext = body.slice(Math.max(0, m.index - 300), m.index);
    const trailingContext = body.slice(m.index + m[0].length, m.index + m[0].length + 60);
    if (
      PER_CAPITA_SKIP.test(m[0]) ||
      PER_CAPITA_SKIP.test(leadContext) ||
      PER_CAPITA_SKIP.test(trailingContext)
    ) continue;
    // skip: data に label として存在しない named ranking (例: 持ち家比率)
    if (isCitingUnknownRanking(m[0], gt)) continue;

    const key = `${pref}:${claimedRank}`;
    if (seenClaims.has(key)) continue;
    seenClaims.add(key);

    const facts = gt[pref];
    if (!facts || facts.length === 0) continue;
    const ranks = facts.filter((f) => f.rank !== null).map((f) => f.rank);
    if (ranks.length === 0) continue;

    if (!ranks.includes(claimedRank)) {
      const actualList = facts
        .filter((f) => f.rank !== null)
        .slice(0, 3)
        .map((f) => `${f.label || "?"}=${f.rank}位`)
        .join(" / ");
      blockers.push(
        `RANK_MISMATCH: 本文「${pref}...${claimedRank}位」 → data: ${actualList}`
      );
    }
  }
  return blockers;
}

function checkInverseRankClaims(content, gt) {
  const blockers = [];
  if (Object.keys(gt).length === 0) return blockers;
  const body = content.replace(/^---[\s\S]*?\n---\n/, "");
  const prefPattern = PREF_NAMES.join("|");
  // pref 直前 ・、と paired claim を除外、文末 (。！？\n) は cross-sentence で除外
  const inverseRe = new RegExp(
    `(?<![・、と])(\\d+)[ \\t]*位[ \\t]*(?:は|の|に|が|を|で|まで|から)?[ \\t]{0,2}(${prefPattern})(?:都|府|県)?(?![・、])`,
    "g"
  );
  const seenClaims = new Set();
  let m;
  while ((m = inverseRe.exec(body)) !== null) {
    const claimedRank = parseInt(m[1], 10);
    const pref = m[2];
    if (claimedRank < 1 || claimedRank > 47) continue;

    // skip: rank-gap や rank-change 表現
    const tailContext = body.slice(m.index + m[0].length, m.index + m[0].length + 30);
    if (RANK_CONTEXT_SKIP.test(tailContext)) continue;
    // skip: 一人当たり derived ranking
    if (PER_CAPITA_SKIP.test(m[0])) continue;
    if (isCitingUnknownRanking(m[0], gt)) continue;

    const key = `${pref}:${claimedRank}`;
    if (seenClaims.has(key)) continue;
    seenClaims.add(key);

    const facts = gt[pref];
    if (!facts || facts.length === 0) continue;
    const ranks = facts.filter((f) => f.rank !== null).map((f) => f.rank);
    if (ranks.length === 0) continue;

    if (!ranks.includes(claimedRank)) {
      let actualPref = null;
      for (const [otherPref, otherFacts] of Object.entries(gt)) {
        if (otherFacts.some((f) => f.rank === claimedRank)) {
          actualPref = otherPref;
          break;
        }
      }
      blockers.push(
        `INVERSE_RANK_MISMATCH: 本文「${claimedRank}位...${pref}」 → data の${claimedRank}位は ${actualPref || "不明"}`
      );
    }
  }
  return blockers;
}

// ============================================================================
// チェック実行
// ============================================================================
const checks = {
  callouts: countCallouts(content),
  internalLinks: countInternalLinks(content),
  charts: countSvgCharts(content),
  charCount: getCharCount(content),
  h2Count: getH2Count(content),
  hasSeoTitle: hasSeoTitle(content),
  hasDescription: hasDescription(content),
  hasDataSource: hasDataSource(content),
};

const blockers = [];
const warnings = [];

// Blocker (auto-merge を阻止)
for (const { pattern, name } of NG_PATTERNS) {
  if (pattern.test(content)) {
    blockers.push(`NG_PATTERN: ${name}`);
  }
}

if (checks.callouts < 2) {
  blockers.push(`callouts < 2 (actual: ${checks.callouts}) — 信頼性シグナル不足`);
}
if (checks.internalLinks < 3) {
  blockers.push(`internalLinks < 3 (actual: ${checks.internalLinks}) — PageRank 還流不足`);
}
if (!checks.hasSeoTitle) {
  blockers.push("seoTitle frontmatter 欠落");
}
if (!checks.hasDescription) {
  blockers.push("description frontmatter 欠落 or 短すぎる (< 50 chars)");
}
if (!checks.hasDataSource) {
  blockers.push("「データ出典」section 欠落");
}
if (checks.charCount < 3000) {
  blockers.push(`charCount < 3000 (actual: ${checks.charCount}) — 内容が薄い`);
}
if (checks.charCount > 25000) {
  warnings.push(`charCount > 25000 (actual: ${checks.charCount}) — 長すぎる可能性`);
}
if (checks.h2Count < 4) {
  blockers.push(`H2 sections < 4 (actual: ${checks.h2Count}) — 構造が浅い`);
}

// Warning (auto-merge は通すが log に残す)
if (checks.charts === 0) {
  warnings.push("チャート (SVG) 0 個 — visual 弱い");
}
if (checks.callouts < 3) {
  warnings.push(`callouts < 3 (actual: ${checks.callouts}) — 推奨は 3-4 個`);
}

// Factual cross-check (2026-05-25): data/*.json と本文の rank claim を突合
const groundTruth = buildGroundTruth(slug);
checks.groundTruthPrefCount = Object.keys(groundTruth).length;
checks.isPerCapitaArticle = isPerCapitaArticle(content);
if (checks.groundTruthPrefCount > 0) {
  if (checks.isPerCapitaArticle) {
    // per-capita 記事は derived ranking が中心で data の絶対 rank と一致しない → warning に降格
    const rankIssues = [
      ...checkRankClaims(content, groundTruth),
      ...checkInverseRankClaims(content, groundTruth),
    ];
    if (rankIssues.length > 0) {
      warnings.push(`per-capita article: ${rankIssues.length} 件 rank 不整合 (verify 推奨)`);
    }
  } else {
    blockers.push(...checkRankClaims(content, groundTruth));
    blockers.push(...checkInverseRankClaims(content, groundTruth));
  }
} else {
  warnings.push("data/*.json なし — factual cross-check スキップ (rank 整合性未検証)");
}

const result = {
  slug,
  pass: blockers.length === 0,
  checks,
  warnings,
  blockers,
};

console.log(JSON.stringify(result, null, 2));
process.exit(blockers.length === 0 ? 0 : 1);
