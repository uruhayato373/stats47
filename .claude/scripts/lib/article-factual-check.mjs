/**
 * article-factual-check.mjs
 *
 * ブログ記事の rank / 数値 claim を data/*.json と突合する factual cross-check 共有ライブラリ。
 *
 * 2026-05-25 の auto-brushup 検証で発覚した数値捏造 (例: 沖縄 財政力指数 41位→実 35位、
 * 奈良 消費支出 35位→実 13位、東京 発電量 42M MWh→実 5.7M MWh) を機械検出するため
 * quality-gate.mjs に実装したロジックを、skill 横断 (auto-brushup-batch / publish-article /
 * draft-from-trend 等) で共有可能な library として切り出し。
 *
 * Usage:
 *   import { checkArticleFactual, buildGroundTruth, PREF_NAMES } from "../lib/article-factual-check.mjs";
 *
 *   const result = checkArticleFactual(articleContent, dataDir);
 *   // result: { blockers: string[], warnings: string[], groundTruthPrefCount, isPerCapitaArticle }
 *
 *   // 個別関数を直接使う場合:
 *   const gt = buildGroundTruth(dataDir);
 *   const issues = checkRankClaims(content, gt);
 *
 * 関連:
 *   - SKILL.md: .claude/skills/blog/auto-brushup-batch/SKILL.md §2-2.5
 *   - failure ledger: .claude/skills/blog/SHARED-failure-cases.md
 *   - 利用箇所: .claude/scripts/blog/quality-gate.mjs
 */

import fs from "node:fs";
import path from "node:path";

// ============================================================================
// 定数 export
// ============================================================================

export const PREF_NAMES = [
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
export const RANK_CONTEXT_SKIP = /(?:もの)?(?:乖離|差(?:が|を|に|は|の|・|、|\s)|の差|格差|落ち|下落|転落|上昇|アップ|ダウン|上昇分|低下分|改善|悪化)/;

// 一人当たり (per capita) は derived ranking で data に直接含まれない → skip
export const PER_CAPITA_SKIP = /(?:一人当たり|1人当たり|1人あたり|人口当たり|人口あたり|per\s*capita|人口比)/i;

// ============================================================================
// Ground truth builder (data/*.json から rank/value 索引を build)
// ============================================================================

export function normalizePref(name) {
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

/**
 * data ディレクトリから ground truth index を build。
 *
 * @param {string} dataDir - data/*.json があるディレクトリ絶対パス
 * @returns {Object} prefName → [{rank, value, label, source}] の index
 */
export function buildGroundTruth(dataDir) {
  const idx = {};
  if (!dataDir || !fs.existsSync(dataDir)) return idx;
  for (const file of fs.readdirSync(dataDir)) {
    if (!file.endsWith(".json")) continue;
    try {
      const json = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
      walkAndIndex(json, idx, file, "");
    } catch {
      // skip malformed JSON
    }
  }
  // SVG title からも value index を追加 (補助、cross-validation 用)
  for (const file of fs.readdirSync(dataDir)) {
    if (!file.endsWith(".svg")) continue;
    try {
      const svg = fs.readFileSync(path.join(dataDir, file), "utf8");
      indexSvgTitles(svg, file, idx);
    } catch {
      // skip
    }
  }
  return idx;
}

function indexSvgTitles(svgContent, source, idx) {
  // <title>都道府県名：metric=値 ...</title> や <circle><title>都道府県：xxx</title></circle> 形式を解析
  const titleRe = /<title>([^<]+)<\/title>/g;
  let m;
  while ((m = titleRe.exec(svgContent)) !== null) {
    const text = m[1];
    // 「都道府県：metric=値」形式
    const parts = text.match(/^(.+?)[：:](.+)$/);
    if (!parts) continue;
    const pref = normalizePref(parts[1].trim());
    if (!pref || !PREF_NAMES.includes(pref)) continue;
    // 値の抽出: "name=value" を全パターン拾う
    const valRe = /([^=\s,]+?)=([\d,.]+(?:百万|万|千|億|兆)?)/g;
    let v;
    while ((v = valRe.exec(parts[2])) !== null) {
      if (!idx[pref]) idx[pref] = [];
      idx[pref].push({
        rank: null,
        value: null,
        valueRaw: v[2],
        label: v[1].trim(),
        source: `[svg] ${source}`,
      });
    }
  }
}

// ============================================================================
// Article-level helpers
// ============================================================================

/**
 * frontmatter (seoTitle / description / subtitle) が per-capita を示すなら per-capita 記事と判定
 */
export function isPerCapitaArticle(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return false;
  return PER_CAPITA_SKIP.test(fmMatch[1]);
}

// data label に存在しない named ranking (例: 持ち家比率) を citing しているなら skip 対象
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

// ============================================================================
// Rank claim checks
// ============================================================================

/**
 * 「<都道府県> ... N位」forward pattern を抽出し、data ground truth と突合
 */
export function checkRankClaims(content, gt) {
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

    const tailContext = body.slice(m.index + m[0].length, m.index + m[0].length + 30);
    if (RANK_CONTEXT_SKIP.test(tailContext)) continue;
    const nextPrefRe = new RegExp(`^[・、の/\\s]{0,3}(${prefPattern})(?:都|府|県)?`);
    if (nextPrefRe.test(tailContext)) continue;
    const leadContext = body.slice(Math.max(0, m.index - 300), m.index);
    const trailingContext = body.slice(m.index + m[0].length, m.index + m[0].length + 60);
    if (
      PER_CAPITA_SKIP.test(m[0]) ||
      PER_CAPITA_SKIP.test(leadContext) ||
      PER_CAPITA_SKIP.test(trailingContext)
    ) continue;
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

/**
 * 「N位 ... <都道府県>」inverse pattern を抽出し、data ground truth と突合
 */
export function checkInverseRankClaims(content, gt) {
  const blockers = [];
  if (Object.keys(gt).length === 0) return blockers;
  const body = content.replace(/^---[\s\S]*?\n---\n/, "");
  const prefPattern = PREF_NAMES.join("|");
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

    const tailContext = body.slice(m.index + m[0].length, m.index + m[0].length + 30);
    if (RANK_CONTEXT_SKIP.test(tailContext)) continue;
    const leadContext = body.slice(Math.max(0, m.index - 300), m.index);
    if (
      PER_CAPITA_SKIP.test(m[0]) ||
      PER_CAPITA_SKIP.test(leadContext)
    ) continue;
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
// 高レベル API
// ============================================================================

/**
 * Article 本文の inline SVG をスキャンし、data-source provenance がない SVG を warning として報告。
 *
 * generate-article-charts.mjs で生成された SVG は冒頭に
 * `<!-- data-source: <file>.json | generated: <iso> -->` provenance comment を持つ。
 * agent が手書きで article.md 内に inline SVG を埋め込むと provenance が無いため、
 * 値が fabricate されている可能性がある (2026-05-25 検証で manufacturing-aichi-dominance 等で発覚)。
 */
export function checkInlineSvgProvenance(content) {
  const warnings = [];
  // article.md の inline SVG (<svg>...</svg> ブロック) を抽出
  const svgRe = /<svg\s+[^>]*xmlns[^>]*>[\s\S]*?<\/svg>/g;
  let m;
  let inlineCount = 0;
  let untracedCount = 0;
  while ((m = svgRe.exec(content)) !== null) {
    inlineCount++;
    // 直前 200 chars 以内に data-source provenance comment があるか
    const lead = content.slice(Math.max(0, m.index - 200), m.index);
    if (!/<!--\s*data-source:/.test(lead)) untracedCount++;
  }
  if (untracedCount > 0) {
    warnings.push(
      `INLINE_SVG_NO_PROVENANCE: ${untracedCount}/${inlineCount} 個の inline SVG に data-source 注記なし — 値の出所が trace 不能、目視で data と整合確認推奨`
    );
  }
  return warnings;
}

/**
 * Article content + data dir を取り、factual cross-check の結果を返す高レベル関数。
 *
 * @param {string} articleContent - article.md の全文
 * @param {string|null} dataDir - data/*.json があるディレクトリ絶対パス
 * @returns {{blockers: string[], warnings: string[], groundTruthPrefCount: number, isPerCapitaArticle: boolean}}
 */
export function checkArticleFactual(articleContent, dataDir) {
  const groundTruth = dataDir ? buildGroundTruth(dataDir) : {};
  const groundTruthPrefCount = Object.keys(groundTruth).length;
  const perCapita = isPerCapitaArticle(articleContent);
  const blockers = [];
  const warnings = [];

  if (groundTruthPrefCount === 0) {
    warnings.push("data/*.json なし — factual cross-check スキップ (rank 整合性未検証)");
    return { blockers, warnings, groundTruthPrefCount, isPerCapitaArticle: perCapita };
  }

  const rankIssues = [
    ...checkRankClaims(articleContent, groundTruth),
    ...checkInverseRankClaims(articleContent, groundTruth),
  ];

  if (perCapita) {
    // per-capita 記事は derived ranking が中心で data の絶対 rank と一致しない → warning に降格
    if (rankIssues.length > 0) {
      warnings.push(`per-capita article: ${rankIssues.length} 件 rank 不整合 (verify 推奨)`);
    }
  } else {
    blockers.push(...rankIssues);
  }

  // SVG provenance check (warning only — 目視確認を促す)
  warnings.push(...checkInlineSvgProvenance(articleContent));

  return { blockers, warnings, groundTruthPrefCount, isPerCapitaArticle: perCapita };
}

// ============================================================================
// CLI entrypoint
// ============================================================================
// 直接 invoke 可能 (publish-article / pre-commit hook 等から):
//   node .claude/scripts/lib/article-factual-check.mjs <article-path> [<data-dir>]
// data-dir 省略時は <article-path>/../data を自動推定。
//
// exit code:
//   0 = pass (blockers なし)
//   1 = fail (blockers あり)
//   2 = article not found

import { fileURLToPath as _ftU } from "node:url";

const _thisFile = _ftU(import.meta.url);
const _isCli = process.argv[1] && _thisFile === path.resolve(process.argv[1]);

if (_isCli) {
  const articlePath = process.argv[2];
  if (!articlePath) {
    console.error("usage: node article-factual-check.mjs <article-path> [<data-dir>]");
    process.exit(1);
  }
  const articleAbs = path.resolve(articlePath);
  if (!fs.existsSync(articleAbs)) {
    console.error(`[error] article not found: ${articleAbs}`);
    process.exit(2);
  }
  const dataDir = process.argv[3]
    ? path.resolve(process.argv[3])
    : path.join(path.dirname(articleAbs), "data");
  const content = fs.readFileSync(articleAbs, "utf8");
  const result = checkArticleFactual(content, dataDir);
  console.log(JSON.stringify({
    article: articleAbs,
    dataDir,
    pass: result.blockers.length === 0,
    ...result,
  }, null, 2));
  process.exit(result.blockers.length === 0 ? 0 : 1);
}
