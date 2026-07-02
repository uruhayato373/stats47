#!/usr/bin/env node
/**
 * ニュースのトピック(自由文キーワード) → 該当統計指標キー を発見するローカル CLI。
 *
 * 索引 (.claude/state/sns/metric-discovery-index.json) をロードし、
 * トピック語を title/subtitle/description/seoTitle/seoDescription/category/
 * additionalCategories/sourceName に対して部分一致でスコアリングする。
 * 日本語なので形態素解析はせず includes ベースの単純マッチにする。
 *
 * 使い方:
 *   node .claude/scripts/sns/find-metrics.mjs <トピック語...> [--top N] [--json]
 *
 * 索引が無い/古い場合は先に build-discovery-index.ts を実行するよう促す。
 *
 * 同義語展開レイヤー: news-synonyms.json (ニュース語 → 指標語彙) があれば、
 * クエリ語をそれで展開してからマッチングする (無くても動作する後方互換)。
 *
 * 配置規約: .claude/rules/skill-code-placement.md
 */
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const INDEX_PATH = path.join(
  PROJECT_ROOT,
  ".claude/state/sns/metric-discovery-index.json",
);
const SYNONYMS_PATH = path.join(__dirname, "news-synonyms.json");

// 同義語一致は直接一致より確度が低いため重みを下げる係数
const SYNONYM_WEIGHT_FACTOR = 0.6;

// フィールドごとの一致重み (高いほどニュース発見の確度が高い)
const FIELD_WEIGHTS = {
  title: 10,
  seoTitle: 8,
  subtitle: 5,
  seoDescription: 4,
  description: 4,
  category: 3,
  additionalCategories: 3,
  sourceName: 1,
};

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { top: 10, json: false, terms: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--top") {
      opts.top = Number(args[++i]) || 10;
    } else if (a === "--json") {
      opts.json = true;
    } else {
      // クォート付き複合語 ("医師 年収") も個別トークンに分割し、
      // クォート無し (医師 年収) と同一挙動にする (空白は半角/全角の両方)
      for (const tok of a.split(/[\s　]+/)) {
        if (tok) opts.terms.push(tok);
      }
    }
  }
  return opts;
}

function loadIndex() {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error(
      `[find-metrics] 索引が見つかりません: ${path.relative(PROJECT_ROOT, INDEX_PATH)}\n` +
        `先に実行してください: npx tsx .claude/scripts/sns/build-discovery-index.ts`,
    );
    process.exit(1);
  }
  // 陳腐化検知: metric 追加時に codegen で再生成される registry.ts より索引が古ければ警告
  // (SSOT は git TS。索引は再生成キャッシュなので新指標が引けない事故を未然に知らせる)
  const REGISTRY_PATH = path.join(
    PROJECT_ROOT,
    "packages/data-configs/src/registry.ts",
  );
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      const idxM = fs.statSync(INDEX_PATH).mtimeMs;
      const regM = fs.statSync(REGISTRY_PATH).mtimeMs;
      if (regM > idxM) {
        console.error(
          `[find-metrics] ⚠️ 索引が古い可能性 (registry.ts が索引より新しい)。新指標が引けない場合は再生成:\n` +
            `  npx tsx .claude/scripts/sns/build-discovery-index.ts`,
        );
      }
    }
  } catch {
    /* stat 失敗は無視して続行 */
  }
  const raw = fs.readFileSync(INDEX_PATH, "utf-8");
  return JSON.parse(raw);
}

// news-synonyms.json が無くても後方互換で動作する (空辞書扱い)
function loadSynonyms() {
  if (!fs.existsSync(SYNONYMS_PATH)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(SYNONYMS_PATH, "utf-8");
    const dict = JSON.parse(raw);
    delete dict._comment;
    return dict;
  } catch (e) {
    console.error(
      `[find-metrics] news-synonyms.json の読み込みに失敗しました (無視して続行): ${e.message}`,
    );
    return {};
  }
}

function fieldText(entry, field) {
  const v = entry[field];
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(" ");
  return String(v);
}

// originalTerm ごとに「直接一致 OR いずれかの同義語一致」を要求する (AND は元語間のみ)。
// expandedByOriginal: Map<originalTerm, Array<{ term, isSynonym }>>
function scoreEntry(entry, expandedByOriginal) {
  let score = 0;
  const matchedFields = new Set();
  const synonymHits = []; // { sourceTerm, matchedTerm }

  for (const [originalTerm, variants] of expandedByOriginal) {
    let termMatched = false;
    let bestVariantScore = 0;
    let bestVariantFields = [];
    let bestVariantIsSynonym = false;
    let bestVariantMatchedTerm = null;

    for (const { term, isSynonym } of variants) {
      const t = term.toLowerCase();
      let variantScore = 0;
      const variantFields = [];
      for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
        const text = fieldText(entry, field).toLowerCase();
        if (text.includes(t)) {
          const w = isSynonym ? weight * SYNONYM_WEIGHT_FACTOR : weight;
          variantScore += w;
          variantFields.push(field);
        }
      }
      if (variantFields.length > 0 && variantScore > bestVariantScore) {
        bestVariantScore = variantScore;
        bestVariantFields = variantFields;
        bestVariantIsSynonym = isSynonym;
        bestVariantMatchedTerm = term;
        termMatched = true;
      }
    }

    if (!termMatched) {
      // 元語 (直接 + 同義語すべて) が全くヒットしない場合は AND ボーナス対象外にする
      return { score: 0, matchedFields: [], allTermsMatched: false, synonymHits: [] };
    }

    score += bestVariantScore;
    bestVariantFields.forEach((f) => matchedFields.add(f));
    if (bestVariantIsSynonym) {
      synonymHits.push({ sourceTerm: originalTerm, matchedTerm: bestVariantMatchedTerm });
    }
  }

  // 複数の元語すべてがヒットした場合の AND ボーナス (トピックの複合語一致を優遇)
  const originalCount = expandedByOriginal.size;
  const allTermsMatched = originalCount > 0;
  if (originalCount > 1 && allTermsMatched) {
    score += originalCount * 5;
  }

  return {
    score: Math.round(score * 10) / 10,
    matchedFields: Array.from(matchedFields),
    allTermsMatched,
    synonymHits,
  };
}

function extractHeadline(entry) {
  // seoTitle からニュース性のある見出し数値部分を抜き出す (無ければ title)
  if (entry.seoTitle) {
    const m = entry.seoTitle.match(/｜.+$/);
    if (m) return m[0].replace(/^｜/, "");
    return entry.seoTitle;
  }
  return entry.title;
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.terms.length === 0) {
    console.error(
      "使い方: node .claude/scripts/sns/find-metrics.mjs <トピック語...> [--top N] [--json]",
    );
    process.exit(1);
  }

  const index = loadIndex();
  const entries = index.entries;
  const synonyms = loadSynonyms();

  // originalTerm -> [{ term, isSynonym }, ...] (直接一致を先頭に含む)
  const expandedByOriginal = new Map();
  for (const term of opts.terms) {
    const variants = [{ term, isSynonym: false }];
    const syns = synonyms[term];
    if (Array.isArray(syns)) {
      for (const syn of syns) {
        variants.push({ term: syn, isSynonym: true });
      }
    }
    expandedByOriginal.set(term, variants);
  }

  const scored = [];
  for (const entry of entries) {
    const { score, matchedFields, allTermsMatched, synonymHits } = scoreEntry(
      entry,
      expandedByOriginal,
    );
    if (score > 0 && allTermsMatched) {
      scored.push({ entry, score, matchedFields, synonymHits });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, opts.top);

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          query: opts.terms,
          totalMatches: scored.length,
          results: top.map((r) => ({
            key: r.entry.key,
            title: r.entry.title,
            category: r.entry.category,
            score: r.score,
            matchedFields: r.matchedFields,
            headline: extractHeadline(r.entry),
            synonymHits: r.synonymHits,
          })),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (top.length === 0) {
    console.log(
      `該当する指標が見つかりませんでした: "${opts.terms.join(" ")}" (索引 ${entries.length} 件中)`,
    );
    return;
  }

  console.log(
    `トピック "${opts.terms.join(" ")}" の該当指標 (${scored.length} 件中上位 ${top.length} 件, 索引 ${entries.length} 件):\n`,
  );
  console.log(
    "順位 | key | title | category | score | headline",
  );
  console.log("-".repeat(100));
  top.forEach((r, i) => {
    const synonymNote =
      r.synonymHits && r.synonymHits.length > 0
        ? ` (同義語: ${r.synonymHits.map((s) => `${s.sourceTerm}→${s.matchedTerm}`).join(", ")} 経由)`
        : "";
    console.log(
      `${String(i + 1).padStart(2)} | ${r.entry.key} | ${r.entry.title} | ${r.entry.category} | ${r.score} | ${extractHeadline(r.entry)}${synonymNote}`,
    );
  });
}

main();
