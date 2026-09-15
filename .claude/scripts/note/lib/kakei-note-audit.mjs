// note 家計シリーズ (a-kakei-<pref>) の draft.md 監査不変条件。
//
// 中心の `auditDraft({markdown, chartData, evidenceData, files})` は fmt*/splitCategoryGroups/
// buildDescription を lib/kakei-note-body.mjs から再利用し、「生成器が出すはずの数字・description」
// と実際の draft.md を突き合わせる。svg-lint (ローカル実ファイル走査) と live-figures (note API) は
// I/O が大きいため CLI (audit-kakei-note-content.mjs) 側の別チェックとして呼ばれる。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MIN_BODY_CHARS,
  buildDescription,
  extractFrontmatter,
  extractFrontmatterField,
  fmtRank,
  fmtRatio,
  fmtValue,
  splitCategoryGroups,
  titleSha256,
} from "./kakei-note-body.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SSOT_PATH = path.join(
  ROOT,
  "packages/data-configs/src/evidence-inventory/kakei-note/expense-evidence.json",
);
const KNOWN_RANKING_KEYS_PATH = path.join(
  ROOT,
  "packages/ranking/src/config/known-ranking-keys.ts",
);

const NG_WORD_RE = /のはず|と思われる|だろう|と考えられる|かもしれない|可能性|兆候|浸透待ち/;

// ---------- 入力読み込み (SSOT はここでだけ fs を触る。テストは checkEvidenceSsot/checkLinks に合成データを渡せる) ----------

export function loadExpenseEvidenceSsot() {
  return JSON.parse(fs.readFileSync(SSOT_PATH, "utf8"));
}

/** known-ranking-keys.ts (自動生成 TS) から `new Set([...])` リテラル内の key を正規表現で抽出する */
export function loadKnownRankingKeys() {
  const content = fs.readFileSync(KNOWN_RANKING_KEYS_PATH, "utf8");
  return parseKnownRankingKeys(content);
}

export function parseKnownRankingKeys(tsContent) {
  const start = tsContent.indexOf("new Set([");
  if (start < 0) throw new Error("known-ranking-keys.ts: `new Set([` リテラルが見つからない");
  const end = tsContent.indexOf("]);", start);
  const body = tsContent.slice(start, end < 0 ? undefined : end);
  const keys = new Set();
  for (const m of body.matchAll(/"([a-z0-9][a-z0-9-]*)"/g)) keys.add(m[1]);
  return keys;
}

// ---------- 本文の数値許容集合 (check 1: numbers) ----------

/**
 * 生成器の fmt 群で入力 JSON から作れる「倍/位/%」表現の全体集合。
 * rankingData = { share, ev1, ev2 } (それぞれ data/*.json の parsed 本体) を渡すと、
 * buildPMap/buildPEvidence が追加で読み上げる都道府県トップ/最下位の数値も許容集合に含める。
 */
export function collectAllowedNumbers(chartData, evidenceData, rankingData = {}) {
  const set = new Set();
  for (const c of chartData.categoryBreakdown) set.add(fmtRatio(c.ratio));
  for (const it of chartData.topRatioItems) set.add(fmtRatio(it.ratio));
  for (const it of chartData.bottomRatioItems) set.add(fmtRatio(it.ratio));
  set.add(fmtRank(evidenceData.dominant.rank));
  set.add(fmtValue(evidenceData.dominant.value, evidenceData.dominant.unit));
  for (const ev of evidenceData.evidence) {
    set.add(fmtRank(ev.rank));
    set.add(fmtValue(ev.value, ev.unit));
  }
  const bottom1 = chartData.bottomRatioItems[0];
  if (bottom1) set.add(`${Math.round(bottom1.ratio * 100)}%`);

  const { share, ev1, ev2 } = rankingData;
  if (share?.data?.length) {
    const rows = share.data;
    for (const row of [rows[0], rows[1], rows[2], rows[rows.length - 1]]) {
      if (row) set.add(fmtValue(row.value, share.unit));
    }
  }
  for (const ranking of [ev1, ev2]) {
    if (ranking?.data?.length) {
      const rows = ranking.data;
      const top1 = rows[0];
      const last = rows[rows.length - 1];
      if (top1) {
        set.add(fmtValue(top1.value, ranking.unit));
        set.add(fmtRank(top1.rank));
      }
      if (last) set.add(fmtValue(last.value, ranking.unit));
    }
  }
  return set;
}

export function checkNumbers({ body, chartData, evidenceData, rankingData }) {
  const allowed = collectAllowedNumbers(chartData, evidenceData, rankingData);
  const found = [
    ...body.matchAll(/\d+(?:\.\d+)?倍/g),
    ...body.matchAll(/\d+位/g),
    ...body.matchAll(/\d+(?:\.\d+)?%/g),
  ].map((m) => m[0]);
  const bad = [...new Set(found.filter((n) => !allowed.has(n)))];
  return {
    ok: bad.length === 0,
    detail:
      bad.length === 0
        ? `${found.length} 個の数値表現がすべて入力データと一致`
        : `入力に無い数値表現: ${bad.join(", ")}`,
  };
}

// ---------- check 2: mentions ----------

export function checkMentions({ body, chartData, evidenceData }) {
  const { closest } = splitCategoryGroups(chartData.categoryBreakdown);
  const required = [
    evidenceData.dominant.catName,
    closest.catName,
    chartData.topRatioItems[0]?.name,
    chartData.bottomRatioItems[0]?.name,
    evidenceData.evidence[0]?.title,
    evidenceData.evidence[1]?.title,
    evidenceData.dominant.shareTitle,
  ].filter(Boolean);
  const missing = required.filter((s) => !body.includes(s));
  return {
    ok: missing.length === 0,
    detail: missing.length === 0 ? "必須語がすべて出現" : `未出現: ${missing.join(", ")}`,
  };
}

// ---------- check 3: ng-words ----------

export function checkNgWords({ body }) {
  const m = body.match(NG_WORD_RE);
  return { ok: !m, detail: m ? `NG語を検出: ${m[0]}` : "NG語なし" };
}

// ---------- check 4: images ----------

const IMAGE_LINE_RE = /^!\[([^\]]*)\]\(images\/([^)]+?)\.png\)$/;

export function extractImageLines(body) {
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => IMAGE_LINE_RE.test(l))
    .map((l) => {
      const m = l.match(IMAGE_LINE_RE);
      return { alt: m[1], name: m[2] };
    });
}

export function checkImages({ body, dominant, ev1, ev2, files }) {
  const lines = extractImageLines(body);
  const expectedNames = [
    "category-ratio",
    `${dominant.shareMetricKey}-tile-grid`,
    "extreme-items",
    `${ev1.metricKey}-prefecture-rankings`,
    `${ev2.metricKey}-prefecture-rankings`,
  ];
  if (lines.length !== 5) {
    return { ok: false, detail: `画像行が5件ではない (実際: ${lines.length}件)` };
  }
  for (let i = 0; i < expectedNames.length; i++) {
    if (lines[i].name !== expectedNames[i]) {
      return {
        ok: false,
        detail: `画像 #${i + 1} は "${expectedNames[i]}" のはずが "${lines[i].name}"`,
      };
    }
  }

  const images = new Set(files?.images || []);
  const data = new Set(files?.data || []);
  // shareTileGrid / ev1 / ev2 の3枚は evidence-data 由来で data/*.json + *.source.json を伴う
  const requireDataPair = new Set([expectedNames[1], expectedNames[3], expectedNames[4]]);
  const missing = [];
  for (const name of expectedNames) {
    if (!images.has(`${name}.png`)) missing.push(`images/${name}.png`);
    if (requireDataPair.has(name)) {
      if (!data.has(`${name}.json`)) missing.push(`data/${name}.json`);
      if (!data.has(`${name}.source.json`)) missing.push(`data/${name}.source.json`);
    }
  }
  if (missing.length > 0) {
    return { ok: false, filesMissing: true, detail: `未生成のファイル: ${missing.join(", ")}` };
  }
  return { ok: true, detail: "5画像が順序どおり・関連ファイルも揃っている" };
}

// ---------- check 5: links ----------

export function checkLinks({ body, knownKeys }) {
  const keys = new Set();
  for (const m of body.matchAll(/\/ranking\/([a-z0-9][a-z0-9-]*)/g)) keys.add(m[1]);
  const bad = [...keys].filter((k) => !knownKeys.has(k));
  return {
    ok: bad.length === 0,
    detail:
      bad.length === 0
        ? `ranking key ${keys.size}件すべて KNOWN_RANKING_KEYS に存在`
        : `未知の ranking key: ${bad.join(", ")}`,
  };
}

// ---------- check 6: length ----------

/** frontmatter・画像行・見出し記号(#)を除いた本文の文字数 */
export function countBodyLength(body) {
  const kept = body
    .split("\n")
    .filter((l) => !IMAGE_LINE_RE.test(l.trim()))
    .map((l) => l.replace(/^#+\s*/, ""));
  return [...kept.join("")].length;
}

export function checkLength({ body }) {
  const len = countBodyLength(body);
  return { ok: len >= MIN_BODY_CHARS, detail: `本文 ${len} 字 (必要 >= ${MIN_BODY_CHARS})` };
}

// ---------- check 7: frontmatter ----------

export function checkFrontmatter({ markdown, chartData, evidenceData }) {
  const fm = extractFrontmatter(markdown);
  if (!fm) return { ok: false, detail: "frontmatter ブロックが見つからない" };
  const title = extractFrontmatterField(fm.raw, "title");
  const description = extractFrontmatterField(fm.raw, "description");
  if (!title) return { ok: false, detail: "frontmatter に title が無い" };
  const actualSha = titleSha256(title);
  const expectedDescription = buildDescription({
    chartData,
    evidenceData,
    pref: evidenceData._meta.prefName,
    city: evidenceData._meta.cityName,
  });
  const problems = [];
  if (actualSha !== evidenceData._meta.titleSha) {
    problems.push(
      `titleSha 不一致 (実際 ${actualSha.slice(0, 8)}… / 期待 ${(evidenceData._meta.titleSha || "").slice(0, 8)}…)`,
    );
  }
  if (description !== expectedDescription) {
    problems.push("description が生成値と不一致");
  }
  return {
    ok: problems.length === 0,
    detail: problems.length === 0 ? "title/description とも生成値と一致" : problems.join("; "),
  };
}

// ---------- check 8: evidence-ssot ----------

export function checkEvidenceSsot({ evidenceData, ssot }) {
  const entry = ssot.entries.find((e) => e.catName === evidenceData.dominant.catName);
  if (!entry) {
    return { ok: false, detail: `SSOT に費目 "${evidenceData.dominant.catName}" のエントリが無い` };
  }
  if (entry.shareMetricKey !== evidenceData.dominant.shareMetricKey) {
    return {
      ok: false,
      detail: `shareMetricKey 不一致 (SSOT: ${entry.shareMetricKey} / データ: ${evidenceData.dominant.shareMetricKey})`,
    };
  }
  const sortedKeys = entry.evidence
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((e) => e.metricKey);
  let cursor = -1;
  for (const ev of evidenceData.evidence) {
    const idx = sortedKeys.indexOf(ev.metricKey, cursor + 1);
    if (idx < 0) {
      return {
        ok: false,
        detail: `根拠指標 "${ev.metricKey}" が SSOT の priority 順で見つからない`,
      };
    }
    cursor = idx;
  }
  return {
    ok: true,
    detail: `dominant + 根拠指標 ${evidenceData.evidence.length}件が SSOT の priority 順と一致`,
  };
}

// ---------- 統合 ----------

/**
 * draft.md の不変条件 8 種 (numbers/mentions/ng-words/images/links/length/frontmatter/evidence-ssot) を検査する純関数。
 * svg-lint / live-figures (I/O が大きい) は CLI (audit-kakei-note-content.mjs) 側で別途扱う。
 *
 * opts.noFiles = true のとき、images check の構造 (5行・順序) は通常どおり検証しつつ、
 * ファイル (png/data json) が未生成であることそのものは非致命 (skipped) として扱う。
 * opts.knownRankingKeys / opts.expenseEvidenceSsot でテスト用の合成データを注入できる
 * (省略時はリポジトリの実ファイルを読む)。
 */
export function auditDraft({ markdown, chartData, evidenceData, files }, opts = {}) {
  const fm = extractFrontmatter(markdown);
  const body = fm ? markdown.slice(fm.full.length) : markdown;
  const dominant = evidenceData.dominant;
  const [ev1, ev2] = evidenceData.evidence;

  // files.dataJson (CLIが data/*.json を JSON.parse して渡す) から buildPMap/buildPEvidence が
  // 追加で読み上げる都道府県トップ/最下位の許容数値を組み立てる。無ければ numbers check は
  // 既存 (chartData/evidenceData 由来) の集合のみで判定する (opts.rankingData で直接注入も可)。
  const dataJson = files?.dataJson || {};
  const rankingData = opts.rankingData || {
    share: dataJson[`${dominant.shareMetricKey}-tile-grid.json`],
    ev1: ev1 ? dataJson[`${ev1.metricKey}-prefecture-rankings.json`] : undefined,
    ev2: ev2 ? dataJson[`${ev2.metricKey}-prefecture-rankings.json`] : undefined,
  };

  const checks = [];

  checks.push({ id: "numbers", ...checkNumbers({ body, chartData, evidenceData, rankingData }) });
  checks.push({ id: "mentions", ...checkMentions({ body, chartData, evidenceData }) });
  checks.push({ id: "ng-words", ...checkNgWords({ body }) });

  const imagesResult = checkImages({ body, dominant, ev1, ev2, files: files || {} });
  checks.push({
    id: "images",
    ok: imagesResult.ok,
    detail: imagesResult.detail,
    ...(opts.noFiles && imagesResult.filesMissing ? { skipped: true } : {}),
  });

  const knownKeys = opts.knownRankingKeys || loadKnownRankingKeys();
  checks.push({ id: "links", ...checkLinks({ body, knownKeys }) });

  checks.push({ id: "length", ...checkLength({ body }) });
  checks.push({ id: "frontmatter", ...checkFrontmatter({ markdown, chartData, evidenceData }) });

  const ssot = opts.expenseEvidenceSsot || loadExpenseEvidenceSsot();
  checks.push({ id: "evidence-ssot", ...checkEvidenceSsot({ evidenceData, ssot }) });

  const ok = checks.filter((c) => !c.skipped).every((c) => c.ok);
  return { ok, checks };
}
