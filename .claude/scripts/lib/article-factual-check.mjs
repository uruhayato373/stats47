/**
 * article-factual-check.mjs
 *
 * ブログ記事の rank / 数値 claim を data/*.json と突合する factual cross-check 共有ライブラリ。
 *
 * 2026-05-25 の auto-brushup 検証で発覚した数値捏造 (例: 沖縄 財政力指数 41位→実 35位、
 * 奈良 消費支出 35位→実 13位、東京 発電量 42M MWh→実 5.7M MWh) を機械検出するため
 * quality-gate.mjs に実装したロジックを、skill 横断 (brushup-blog / publish-article /
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
 *   - SKILL.md: .claude/skills/blog/brushup-blog/SKILL.md (共通 Step A ground-truth 確認)
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

// 派生値 (差額・比・当たり・平均・合計・換算 等) は data の「絶対 value」と一致しないため
// value WARN (gross mismatch) の対象から除外する。誤検出 (例:「差額176円」「受け持つ住民数325人」
// 「1人当たり…」が VALUE_MISMATCH 扱いになる) を防ぐ。WARN のみなので過剰 skip でも害は小さい。
export const DERIVED_VALUE_SKIP =
  /(?:差額|の差|との差|差は|差が|差を|差で|格差|当たり|あたり|受け持|受持|につき|平均|中央値|合計|総額|総計|累計|比率|比は|比が|割合|シェア|構成比|換算|÷|割っ|割る|上回|下回|倍)/;

/**
 * 符号付き数値は差分 (増減・格差) を表す表記。
 *
 * ★記事側の表記ルールと対になる (2026-07-31)。差分を書くときは必ず符号を付けることで、
 * 「data の絶対値ではない」と機械が判定できる。実記事は既にこの書き方をしている:
 * care-worker-income-prefecture-gap の `**+145.7万円**` / `**−15.8万円**`。
 * (差分表記そのものを義務づけるルールは未制定。現状は記事が自然にこう書いている)
 */
export const SIGNED_DELTA_RE = /[+＋\-−–—▲△]\s*$/;

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

function extractUnit(item) {
  if (typeof item.unit === "string") return item.unit;
  if (typeof item.unitName === "string") return item.unitName;
  return null;
}

/** `<base>.json` に対応する `<base>.source.json` の {label, unit, year} を読む (無ければ空) */
function readSourceMeta(dataDir, jsonFile) {
  const sourcePath = path.join(dataDir, jsonFile.replace(/\.json$/, ".source.json"));
  if (!fs.existsSync(sourcePath)) return {};
  try {
    const meta = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    return {
      label: typeof meta.label === "string" ? meta.label : null,
      unit: typeof meta.unit === "string" ? meta.unit : null,
      year: typeof meta.year === "string" || typeof meta.year === "number" ? String(meta.year) : null,
    };
  } catch {
    return {};
  }
}

/**
 * 散布図 `{xLabel, xUnit, yLabel, yUnit, points:[{x, y, label}]}` を 2 軸ぶん索引する。
 *
 * ★なぜ要るか (2026-07-31 実測): 散布図の点は `pref`/`value` フィールドを持たないため
 * `isPrefEntry` が false になり、**ground truth に 1 件も入らなかった**。その結果、
 * 散布図の軸を本文で引用すると「照合先が無い」ではなく「別指標と乖離」と誤検出される。
 *
 * 実例: black-tea-income-gap は所得 (千円) と紅茶支出 (円) の散布図を持つ。本文の
 * 「神奈川…6,220千円」は散布図 x 軸の正しい値なのに、同じ次元 (円) の紅茶支出 1,780円 と
 * 比較され「3494倍 乖離」と報告されていた。軸ごとに単位を付けて索引すれば一致し、消える。
 *
 * @returns {boolean} 索引したら true (呼び出し側は generic 再帰を省略できる)
 */
function indexScatterPoints(node, idx, source) {
  if (!node || !Array.isArray(node.points)) return false;
  const axes = [
    { key: "x", label: node.xLabel, unit: node.xUnit },
    { key: "y", label: node.yLabel, unit: node.yUnit },
  ].filter((a) => typeof a.unit === "string");
  if (axes.length === 0) return false;

  let indexed = false;
  for (const point of node.points) {
    if (!point || typeof point !== "object") continue;
    const pref = normalizePref(point.label ?? point.areaName ?? point.pref ?? "");
    if (!pref || !PREF_NAMES.includes(pref)) continue;
    for (const axis of axes) {
      if (typeof point[axis.key] !== "number") continue;
      if (!idx[pref]) idx[pref] = [];
      idx[pref].push({
        rank: null,
        value: point[axis.key],
        unit: axis.unit,
        label: axis.label || axis.key,
        source,
      });
      indexed = true;
    }
  }
  return indexed;
}

/**
 * 複数年平均の都市ランキング `{years, data:[{rank, areaCode, areaName, value, isCapital, byYear}]}`
 * (fetch-kakei-city-average.mjs の出力) を「平均の系列」(series: "avg") として索引する。
 *
 * ★なぜ別系列にするか (FACTUAL-CHECK-CROSS-METRIC-RANK-01): 県別ランキングは県庁所在市の単年値で、52 市の
 * 3 年平均とは順位も値も違う。同じ県の facts に混ぜると本文の「京都市 3 位 (平均)」を「京都府 2 位 (単年)」と
 * 取り違えるので、`series` で区別し、claimFacts が本文の文脈 (市名・平均の語) で選ぶ。
 * 県庁所在市は areaCode の上 2 桁 (JIS 都道府県コード = PREF_NAMES の順) で県にも結ぶ。
 *
 * @returns {boolean} 索引したら true (呼び出し側は generic 走査を省略できる)
 */
function indexAverageSeries(json, idx, source, meta) {
  const rows = json && Array.isArray(json.data) ? json.data : null;
  if (!rows || !rows.some((r) => r && typeof r === "object" && r.byYear && typeof r.byYear === "object")) return false;
  const label = meta.label || (typeof json.title === "string" ? json.title : "");
  const unit = (typeof json.unit === "string" && json.unit) || meta.unit || null;
  let indexed = false;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const name = normalizePref(extractPrefName(row));
    if (!name) continue;
    const keys = new Set([name]);
    if (!PREF_NAMES.includes(name) && row.isCapital !== false && typeof row.areaCode === "string") {
      const prefName = PREF_NAMES[parseInt(row.areaCode.slice(0, 2), 10) - 1];
      if (prefName) keys.add(prefName);
    }
    for (const key of keys) {
      if (!idx[key]) idx[key] = [];
      idx[key].push({ rank: extractRank(row), value: extractValue(row), unit: extractUnit(row) || unit, label, source, series: "avg" });
      for (const [year, value] of Object.entries(row.byYear)) {
        if (typeof value !== "number") continue;
        idx[key].push({ rank: null, value, unit: extractUnit(row) || unit, label, source, series: "avg", year: String(year) });
      }
    }
    indexed = true;
  }
  return indexed;
}

function walkAndIndex(node, idx, source, currentLabel, currentUnit) {
  if (node && typeof node === "object" && !Array.isArray(node)) {
    // 散布図は専用形式 (points + 軸ごとの単位) なので generic 走査より先に処理する
    if (indexScatterPoints(node, idx, source)) return;
  }
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
          unit: extractUnit(item) || currentUnit || null,
          // ★item 自身の label を優先する。flat 配列
          //   `[{areaName,value,label,unit}]` (§1 の統一 schema) では currentLabel が空になり、
          //   label 空 → mentionsForeignMetric が「未知指標」と判定して**全 claim を skip**していた
          //   (2026-08-12 実測。値検出力ゼロの一因)。
          label: (typeof item.label === "string" && item.label) || currentLabel,
          source,
        });
      }
    } else {
      node.forEach((child) => walkAndIndex(child, idx, source, currentLabel, currentUnit));
    }
  } else if (node && typeof node === "object") {
    for (const [key, val] of Object.entries(node)) {
      let nextLabel = currentLabel;
      let nextUnit = currentUnit;
      if (val && typeof val === "object" && !Array.isArray(val)) {
        if (typeof val.label === "string") nextLabel = val.label;
        else if (typeof val.rankingKey === "string") nextLabel = val.rankingKey;
        else if (typeof val.categoryName === "string") nextLabel = val.categoryName;
        else if (typeof val.category_code === "string") nextLabel = val.category_code;
        else nextLabel = key;
        // wrapper オブジェクトに unit があれば配下に継承 (nested schema: {label, unit, data:[...]})
        if (typeof val.unit === "string") nextUnit = val.unit;
      } else if (Array.isArray(val) && val.length > 0 && isPrefEntry(val[0])) {
        // currentLabel が「rankings/data」等の汎用 key なら上書き、そうでなければ保持
        if (!currentLabel || currentLabel === "rankings" || currentLabel === "data") {
          nextLabel = key;
        }
      }
      // 同階層に unit フィールドがあれば次階層へ継承 (data 配列と並ぶケース)
      if (typeof node.unit === "string") nextUnit = node.unit;
      walkAndIndex(val, idx, source, nextLabel, nextUnit);
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
    // .source.json は出典 manifest (rankingKey/年など)。観測値ではないので索引しない
    // (索引すると year 等が ground truth 値として誤照合する)。
    if (!file.endsWith(".json") || file.endsWith(".source.json")) continue;
    try {
      const json = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
      // 出典 manifest の label/unit を既定値として引き継ぐ (2026-07-31)。
      // ranking 形式の JSON は label が "data" のような汎用キーになり、どの指標の値か
      // 判別できない。source.json は人間可読な指標名 (例「紅茶消費支出額」) を持つので、
      // これを既定 label にすると「本文が別指標を語っているか」を判定できるようになる。
      const meta = readSourceMeta(dataDir, file);
      if (!indexAverageSeries(json, idx, file, meta)) {
        walkAndIndex(json, idx, file, meta.label || "", meta.unit || null);
      }
      // data の年を各 fact に付ける。本文が別の年の順位を語っているかの判定に使う (無ければ判定しない)
      if (meta.year) {
        for (const facts of Object.values(idx)) {
          for (const f of facts) if (f.source === file && f.year === undefined) f.year = meta.year;
        }
      }
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
// 系列の選択 (FACTUAL-CHECK-CROSS-METRIC-RANK-01)
// ============================================================================

/** 「3年平均」「5年間の平均」「八年平均」のような期間の平均 (「平均寿命」や単なる「平均」は含まない) */
const PERIOD_AVERAGE_RE = /(?:[0-9０-９]+|[二三四五六七八九十]+)\s*(?:年間|か年|ヵ年|年)\s*(?:の)?\s*(?:単純)?平均/;

/** 数値そのものが平均順位 (「平均4位」「平均順位は5位」) を表す書き方 */
const AVERAGE_RANK_RE = /平均(?:順位)?\s*(?:は|が|の)?\s*約?\s*$/;

/**
 * 本文の 1 つの主張が照合してよい facts を返す。
 * 県別ランキング (県庁所在市の単年値) と 52 市・複数年平均の都市ランキング (series: "avg") は別の系列なので、
 * 平均を語る文か、県名の直後に「市」が付く主張 (京都市) のときだけ平均の系列も照合先に足す。
 * 平均を語っているのに平均の系列が data に無いなら null (照合先なし = 呼び出し側は主張を飛ばす)。
 *
 * @returns {object[] | null}
 */
function claimFacts(facts, { cityScope, averageScope }) {
  const single = facts.filter((f) => f.series !== "avg");
  const avg = facts.filter((f) => f.series === "avg");
  if (averageScope && avg.length === 0) return null;
  return cityScope || averageScope ? [...single, ...avg] : single;
}

/**
 * 順位の直前に指標名を名指ししているとき (「年収42位の北海道」「北海道の年収は42位」)、その指標の系列の順位だけを返す。
 * 同じ県に別の指標の順位 (割合は 42 位) があると、どの系列の順位にも当てはまれば一致扱いになり、年収の順位の誤りが通っていた
 * (BLOG-TUTORIAL-GATE-GAPS-01)。
 * 名指しの語は順位の直前の漢字・カタカナの連なり (助詞 1 字は許す)。その語を含む label の系列が一部だけあるときに限り絞る。
 * 語が無い・どの label にも含まれない・全系列に含まれるときは絞らない (従来どおりどの系列とも照合する)。
 *
 * @param {object[]} facts 照合先の facts
 * @param {string} leadText 順位の数字の直前までの文字列
 * @returns {object[]} 順位を持つ facts (絞れたときは名指しされた指標のものだけ)
 */
function rankFactsForNamedMetric(facts, leadText) {
  const ranked = facts.filter((f) => f.rank !== null);
  const token = leadText.match(/([一-龥ァ-ヶー]{2,8})(?:が|は|で|も|の)?[ \t]*$/)?.[1];
  if (!token) return ranked;
  const named = ranked.filter((f) => typeof f.label === "string" && f.label.includes(token));
  return named.length > 0 && named.length < ranked.length ? named : ranked;
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
  const knownLabels = collectKnownLabels(gt);
  const body = content.replace(/^---[\s\S]*?\n---\n/, "");
  const prefPattern = PREF_NAMES.join("|");
  const rankRe = new RegExp(
    `(${prefPattern})(?:都|府|県)?[^、。\\n（）()]{0,40}?(?<![\\d.．])(\\d+(?:[.．]\\d+)?)\\s*位`,
    "g"
  );
  const seenClaims = new Set();
  let m;
  while ((m = rankRe.exec(body)) !== null) {
    const pref = m[1];
    // 小数の順位 (「平均4.8位」) と平均順位 (「平均5位」) は順位そのものではなく集計値 (FACTUAL-CHECK-CROSS-METRIC-RANK-01)
    if (m[2].includes(".") || m[2].includes("．")) continue;
    const beforeRank = m[0].slice(0, m[0].lastIndexOf(m[2]));
    if (AVERAGE_RANK_RE.test(beforeRank)) continue;
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
    // 同じ文で data に無い指標 (「カツオの購入数量では」) を語っている順位は照合できない (FACTUAL-CHECK-CROSS-METRIC-RANK-01)
    const rankSentenceStart = Math.max(
      body.lastIndexOf("。", m.index - 1) + 1,
      body.lastIndexOf("\n", m.index - 1) + 1,
      m.index - 200,
    );
    const rankContext = body.slice(rankSentenceStart, m.index) + m[0].slice(0, m[0].lastIndexOf(m[2]));
    if (mentionsForeignMetric(rankContext, knownLabels)) continue;

    // 県名の直後が「市」なら都市の主張、文が期間の平均を語るなら平均の系列も照合先に足す。平均の系列が無ければ照合しない
    const cityScope = new RegExp(`^${pref}(?:都|府|県)?(?:市|区部)`).test(m[0]);
    const averageScope = PERIOD_AVERAGE_RE.test(rankContext);
    const key = `${pref}:${claimedRank}:${cityScope}:${averageScope}`;
    if (seenClaims.has(key)) continue;
    seenClaims.add(key);

    const facts = claimFacts(gt[pref] || [], { cityScope, averageScope });
    if (!facts || facts.length === 0) continue;
    const rankedFacts = rankFactsForNamedMetric(facts, beforeRank);
    const ranks = rankedFacts.map((f) => f.rank);
    if (ranks.length === 0) continue;
    // data の年が分かっていて、本文がそれと違う年の順位を語っているなら照合しない (「1972 年は 2 位」)
    // 年ごとの値だけを持つ系列 (順位なし) の年も、その年の順位は照合できない
    const claimYear = m[0].match(/((?:19|20)\d{2})\s*年/)?.[1];
    const dataYears = facts.map((f) => f.year).filter(Boolean);
    if (claimYear && dataYears.length > 0) {
      if (!dataYears.includes(claimYear)) continue;
      if (!facts.some((f) => f.year === claimYear && f.rank !== null)) continue;
    }

    if (!ranks.includes(claimedRank)) {
      const actualList = rankedFacts
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
    // 先頭に数字を含めない (?<![・、と\d]): 「45位 岩手県」を「5位 岩手県」と誤マッチしないため。
    // 二桁順位 (下位グループ 4X位/3X位) を一桁順位に切り詰める false positive を防ぐ。
    // 「から」「まで」は範囲の言い方 (「秋田県の3位から青森県の46位まで」) で、直後の県の順位ではないので助詞に含めない。
    `(?<![・、と\\d.．])(\\d+)[ \\t]*位[ \\t]*(?:は|の|に|が|を|で)?[ \\t]{0,2}(${prefPattern})(?:都|府|県)?(?![・、])`,
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
    // 平均順位 (「平均5位の京都府」) は順位そのものではない
    if (AVERAGE_RANK_RE.test(body.slice(Math.max(0, m.index - 12), m.index))) continue;

    // 県名の直後が「市」なら都市の主張、同じ文が期間の平均を語るなら平均の系列も照合先に足す (checkRankClaims と同じ)
    const cityScope = /^(?:市|区部)/.test(body.slice(m.index + m[0].length));
    const sentenceStart = Math.max(
      body.lastIndexOf("。", m.index - 1) + 1,
      body.lastIndexOf("\n", m.index - 1) + 1,
      m.index - 200,
    );
    const averageScope = PERIOD_AVERAGE_RE.test(body.slice(sentenceStart, m.index + m[0].length));
    const key = `${pref}:${claimedRank}:${cityScope}:${averageScope}`;
    if (seenClaims.has(key)) continue;
    seenClaims.add(key);

    const facts = claimFacts(gt[pref] || [], { cityScope, averageScope });
    if (!facts || facts.length === 0) continue;
    const ranks = rankFactsForNamedMetric(facts, body.slice(Math.max(0, m.index - 12), m.index)).map((f) => f.rank);
    if (ranks.length === 0) continue;

    if (!ranks.includes(claimedRank)) {
      let actualPref = null;
      for (const [otherPref, otherFacts] of Object.entries(gt)) {
        if (otherFacts.some((f) => f.series !== "avg" && f.rank === claimedRank)) {
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
// Value claim cross-check (Phase C, 2026-05-28)
// ============================================================================
//
// 本文の「<都道府県> ... <数値><単位>」claim を data の value と突合する。
// rank と違い value は単位スケール (兆/億/万) のずれで誤判定しやすいため、
// 以下を徹底して **誤検出を避ける (WARN のみ・blocker にしない)**:
//   1. claim と data の単位を共通スケールに正規化してから比較
//   2. 単位の「次元」(円/人/%/MWh 等) が一致する value とのみ比較。不一致は skip
//   3. ±5% 以内で一致する value があれば OK。無く、かつ最近傍と 3 倍以上乖離する
//      場合のみ「gross mismatch (要確認)」を WARN (例: 東京 発電量 42M→実 5.7M)
//   4. 単位の無い裸の数値・年号・rank (位) は対象外
//   5. 派生値 (差額/比/当たり/平均/合計/換算 = DERIVED_VALUE_SKIP, PER_CAPITA_SKIP) は
//      data の絶対 value と一致しないため対象外 (誤検出防止、2026-05-30 追加)

const JA_SCALE = { 兆: 1e12, 億: 1e8, 万: 1e4, 千: 1e3, 百万: 1e6 };

/** "3,822" / "5.9" / "58" → number。失敗時 null */
function parseNumeric(s) {
  const n = parseFloat(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * 日本語の複合数値表記を実数へ (「4万5,897」「1億2,000万」「1万5千」「2.5万」「12,345」)。
 *
 * ★なぜ要るか (2026-07-31 実測): 旧実装は「数値 + スケール 1 個」しか解釈できず、
 * 日本語散文で普通に使う **漢数字スケール混在表記**を取りこぼしていた。
 * 「4万5,897円」は末尾の `5,897` だけが数値として拾われ、data の 45,897 と
 * 「7.8倍 乖離」と誤検出される。公開済み 388 記事の測定で検出 172 件のうち多数がこれだった。
 *
 * 取りこぼしは誤検出だけでなく **検出漏れ**も生む (本当に誤った「4万5,897円」を
 * 別の数として比較してしまう)。パーサを直さない限りこのチェックは blocker にできない。
 *
 * @returns {number|null} 解釈できなければ null
 */
export function parseJapaneseNumeral(s) {
  if (typeof s !== "string") return null;
  const partRe = /([\d,]+(?:\.\d+)?)\s*(百万|兆|億|万|千)?/g;
  let total = 0;
  let sawAny = false;
  let m;
  while ((m = partRe.exec(s)) !== null) {
    if (!m[1]) continue;
    const n = parseFloat(m[1].replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    total += n * (m[2] ? JA_SCALE[m[2]] ?? 1 : 1);
    sawAny = true;
  }
  return sawAny ? total : null;
}

/**
 * ja スケール接頭/接尾 (兆/億/百万/万/千) を倍率に。無ければ 1。
 *
 * ★長い語から順に判定する (2026-07-31 修正)。旧実装は JA_SCALE の宣言順で `includes` して
 * いたため、`"百万円"` が **`万` に先にマッチして 1e4** を返していた。data 側だけが 100 分の 1 に
 * 評価され、本文と data が同じ値でも「100.0倍 乖離」と誤検出される (cc-estat 系記事で実発生)。
 */
const JA_SCALE_BY_LENGTH = Object.entries(JA_SCALE).sort((a, b) => b[0].length - a[0].length);

function jaScaleMultiplier(token) {
  if (!token) return 1;
  for (const [k, v] of JA_SCALE_BY_LENGTH) {
    if (token.includes(k)) return v;
  }
  return 1;
}

/**
 * 単位の「次元トークン」を抽出 (円 / 人 / % / MWh / ha / 時間 / kg / 件 / 床 / 戸 等)。
 * スケール接頭辞 (兆億万千百) を除いた実体部分。
 */
function unitDimension(unit) {
  if (typeof unit !== "string") return null;
  const stripped = unit.replace(/[兆億万千百]/g, "").trim();
  const m = stripped.match(/(%|％|円|人|世帯|戸|床|件|台|校|時間|ha|㎡|平方|kg|kw|wh|mwh|kwh|度|℃|cm|mm|社|店)/i);
  // 全角の「％」で持つ data と半角の「%」で書いた本文を別の次元と見なさない (BLOG-TUTORIAL-GATE-GAPS-01)
  return m ? m[1].toLowerCase().replace("％", "%") : (stripped || null);
}

/** data fact の value を base スケールに正規化 (value × unit のスケール倍率) */
function factBaseValue(fact) {
  if (typeof fact.value !== "number") return null;
  return fact.value * jaScaleMultiplier(fact.unit || "");
}

/**
 * 本文の value claim を抽出し、data ground truth と突合 (WARN のみ)。
 * @returns {string[]} warnings
 */
/**
 * 位置 pos が同一行の括弧 (…) / （…） の内側か。
 * 行をまたぐ括弧は markdown のリンク記法等と衝突するため見ない。
 */
function isInsideParenthesis(body, pos) {
  const lineStart = body.lastIndexOf("\n", pos - 1) + 1;
  let lineEnd = body.indexOf("\n", pos);
  if (lineEnd === -1) lineEnd = body.length;
  const before = body.slice(lineStart, pos);
  const after = body.slice(pos, lineEnd);
  const opens = (before.match(/[（(]/g) || []).length;
  const closes = (before.match(/[）)]/g) || []).length;
  if (opens <= closes) return false;
  return /[）)]/.test(after);
}

/**
 * 記事が持つ指標名 (ground truth の label) を集める。
 * 「この記事が扱っている指標」の集合であり、これに無い指標を本文が語っていたら照合できない。
 */
function collectKnownLabels(gt) {
  const labels = new Set();
  for (const facts of Object.values(gt)) {
    for (const f of facts) {
      if (typeof f.label === "string" && f.label.length >= 2) labels.add(f.label);
    }
  }
  return [...labels];
}

/** 指標名らしき語 (「緑茶消費支出額」「発電量」「持ち家率」等) */
const METRIC_PHRASE_RE =
  /[ぁ-んァ-ヶ一-龥ー]{2,12}(?:消費支出額|消費量|支出額|保有台数|世帯数|生産量|出荷額|年収|月収|所得|収入|単価|価格|残高|貯蓄|人口|面積|件数|台数|日数|時間|率|額|量|数)/g;

/**
 * claim 直前の文脈が「この記事に ground truth が無い別指標」を語っているか。
 *
 * ★なぜ要るか (2026-07-31 実測): 記事は比較のため他指標の数値を引くことがある。
 * 例 black-tea-income-gap:「ちなみに緑茶消費支出額の全国1位は静岡県(7,664円)」。
 * 緑茶の値はこの記事の data/ に無いので **検証不能**なのに、同じ次元 (円) の
 * 紅茶消費支出額 597円 と比較され「771倍 乖離」と誤検出されていた。
 *
 * 判定は保守的にする: 直前に指標名らしき語があり、それが記事の既知指標のどれとも
 * 結び付かないときだけ skip する。「1位の神奈川県は1,780円」のように指標名を伴わない
 * 通常の文は従来どおり照合する (検出力を落とさない)。
 */
/**
 * 分母つき指標を示す修飾子 (「人口10万人あたり」「1人当たり」「1世帯当たり」…)。
 *
 * ★分母の情報は `unit` ではなく **label / subtitle** が持つ (2026-08-12 に実装を確認)。
 *   metric config は `title: 糖尿病による死亡者数` / `subtitle: 人口10万人当たり` / `unit: 人` と
 *   3 つに分けており、blog の data json も `label: 人口10万人あたり外国人数` / `unit: 人` と同じ形。
 *   unit に分母を足すと「人口10万人当たり … 20.6人（人口10万対）」と二重表示になるので、
 *   **unit は素のままが正しい**。判定は label 側で行う。
 */
const DENOMINATOR_QUALIFIER_RE =
  /(人口\s*\d+\s*万?\s*人?\s*(?:あたり|当たり|対)|人口千対|[1１一]\s*人\s*(?:あたり|当たり)|[1１一]\s*世帯\s*(?:あたり|当たり)|[1１一]\s*件\s*(?:あたり|当たり)|per\s*capita)/;

function hasDenominatorQualifier(s) {
  return typeof s === "string" && DENOMINATOR_QUALIFIER_RE.test(s);
}

function mentionsForeignMetric(lead, knownLabels) {
  const phrases = lead.match(METRIC_PHRASE_RE);
  if (!phrases || phrases.length === 0) return false;
  const phrase = phrases[phrases.length - 1]; // claim に最も近い語
  // ★分母の有無が違う指標は「別の量」なので結び付けない (2026-08-12)。
  //
  //   data label「人口10万人あたり公害苦情受理件数」に本文の「公害苦情受理件数」は
  //   部分文字列として含まれるため、素の includes だけだと**実数と人口当たりを同一視**して
  //   比較してしまう。実測ではこれが誤検出の主因で、本文 12,811件 (実数) と
  //   data 41.3件 (人口10万対) を「310 倍の乖離」と報告していた。本文は誤っていない。
  //
  //   修飾子が **両方にある / 両方に無い** ときだけ同じ指標とみなす。
  const phraseHasDenom = hasDenominatorQualifier(lead);
  return !knownLabels.some((label) => {
    if (!(label.includes(phrase) || phrase.includes(label))) return false;
    return hasDenominatorQualifier(label) === phraseHasDenom;
  });
}

/**
 * 差・増減・振れ幅の数値 (「堺市と69円差」「4,304円増えており」「2,415円離れて」「560円の範囲」) は data の値ではない。
 * 県名から数値までの間に語がある場合 (DELTA_BEFORE_RE) と、数値の直後に語が続く場合 (DELTA_AFTER_RE) の両方を見る。
 */
const DELTA_BEFORE_RE = /差|増え|増加|増や|減り|減少|減ら|離れ|開き|上回|下回|振れ幅|変動幅|範囲|合計|平均/;
/** 同じ文の頭から数値までに差・振れ幅を語る語がある (「最大と最小の差を比べると、京都市は4,304円」) */
const DELTA_CONTEXT_RE = /差|振れ幅|変動幅|増減|離れ/;
const DELTA_AFTER_RE = /^\s*(?:差|の差|離れ|増|減|上回|下回|の範囲|の幅|の振れ|の開き|の違い|アップ|ダウン|上昇|下落|超の差)/;
/**
 * 数値の直後に「しか」「の」「だけ」などを挟んで増減を語る書き方 (「1,856円しか目減りしません」「22,681円多く残ります」)。
 * DELTA_AFTER_RE は語が数値に直接続く形しか見ないため、2 県の差や目減り額を県の値と取り違えていた (BLOG-TUTORIAL-GATE-GAPS-01 ⑤)
 */
const DELTA_AFTER_PARTICLE_RE =
  /^\s*(?:分が?|ほど|も|だけ|しか|の)?\s*(?:目減り|減|増|差|開き|多[くいけ]|少な[くいけ]|高[くいけ]|低[くいけ]|安[くいけ]|大き[くいけ]|小さ[くいけ])/;
/** 「東京都は24,537円、埼玉県は1,856円目減りします」の、述語を共有する並列の次の項 (県名 + 数値 + 単位) */
const PARALLEL_ITEM_RE = new RegExp(
  `^\\s*[、，,]\\s*(?:${PREF_NAMES.join("|")})(?:都|府|県)?\\s*(?:は|が|では|も)?\\s*(?:[\\d,]+(?:\\.\\d+)?\\s*(?:百万|兆|億|万|千)?)+\\s*(?:MWh|kWh|GWh|kW|MW|Wh|円|人|世帯|戸|床|件|台|校|時間|ha|㎡|kg|%|％|社|店)`,
);
/** 数値が「県名の直後」でも、その県単独の値ではなく県の組の合計を語る書き方 (「岐阜・愛知・三重」「東京・神奈川・埼玉の3都県」) */
const PREF_GROUP_BEFORE_RE = new RegExp(`(?:${PREF_NAMES.join("|")})(?:都|府|県)?\\s*[・と]\\s*$`);
const PREF_GROUP_BETWEEN_RE = /の\s*[0-9０-９一二三四五六七八九十]+\s*(?:都道府県|都府県|府県|都県|道県|県)/;

/**
 * 増減を語る述語が数値の後ろにあるか。並列の項 (「、埼玉県は1,856円」) を飛ばして、述語を共有する最後の項の後ろを見る。
 */
function hasDeltaPredicateAfter(body, numEnd) {
  let rest = body.slice(numEnd, numEnd + 80);
  for (let m = PARALLEL_ITEM_RE.exec(rest); m; m = PARALLEL_ITEM_RE.exec(rest)) rest = rest.slice(m[0].length);
  return DELTA_AFTER_RE.test(rest.slice(0, 8)) || DELTA_AFTER_PARTICLE_RE.test(rest.slice(0, 10));
}

/**
 * 数値が、同じ段落に書いた同じ単位の 2 つの数値の差に等しいか (「620,576円が618,720円になり、…1,856円」)。
 * 差は data に無い派生値なので、県の値と照合しない。本文が言い切った桁の精度 (かつ 0.5% 以内) で一致したときだけ認める。
 */
function equalsDifferenceInParagraph(body, numIndex, numEnd, claimBase, tolerance, unitTail, numRe) {
  if (tolerance === null) return false;
  // 「3万円」のような丸めた数は許容幅が広く、段落の数値の差に偶然一致しやすい。差は本文が計算して書く値なので 0.5% 以内に絞る
  const diffTolerance = Math.min(tolerance, Math.abs(claimBase) * 0.005);
  const paraStart = body.lastIndexOf("\n", numIndex - 1) + 1;
  let paraEnd = body.indexOf("\n", numEnd);
  if (paraEnd === -1) paraEnd = body.length;
  const values = [];
  for (const other of body.slice(paraStart, paraEnd).matchAll(numRe)) {
    if (paraStart + other.index === numIndex || unitDimension(other[2]) !== unitDimension(unitTail)) continue;
    const v = parseJapaneseNumeral(other[1].trim());
    if (v !== null) values.push(v);
  }
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      if (Math.abs(Math.abs(values[i] - values[j]) - claimBase) <= diffTolerance) return true;
    }
  }
  return false;
}

const APPROX_BEFORE_RE = /(約|およそ|おおよそ|ほぼ|概ね|おおむね)\s*$/;

/**
 * 本文の数値が言い切っている精度から許容幅を返す (最後の 0 でない桁の半分 × 桁の接頭辞)。
 * 例: 「4,790」→ 5 / 「5,000」→ 500 / 「3.8」→ 0.05 / 「468万」→ 5,000。
 * 複数のスケールを跨ぐ表記 (「4万5,897」) は最後の部分の精度を使う。数値が読めなければ null。
 */
export function claimTolerance(numeralRaw) {
  const parts = [...String(numeralRaw).matchAll(/([\d,]+(?:\.\d+)?)\s*(百万|兆|億|万|千)?/g)];
  const last = parts[parts.length - 1];
  if (!last) return null;
  const digits = last[1].replace(/,/g, "");
  const scale = last[2] ? JA_SCALE[last[2]] ?? 1 : 1;
  const [intPart, frac = ""] = digits.split(".");
  let unit;
  if (frac.length > 0) unit = 10 ** -frac.length;
  else {
    const trailingZeros = intPart.length - intPart.replace(/0+$/, "").length;
    unit = intPart.replace(/0+$/, "") === "" ? 1 : 10 ** trailingZeros;
  }
  return (unit / 2) * scale;
}

export function checkValueClaims(content, gt) {
  const warnings = [];
  if (Object.keys(gt).length === 0) return warnings;
  const body = content.replace(/^---[\s\S]*?\n---\n/, "");
  const prefPattern = PREF_NAMES.join("|");
  const knownLabels = collectKnownLabels(gt);

  // ★抽出は「県名を先に全部拾い、そのあと数値を独立に走査して直前の県に紐づける」方式にする。
  //   旧実装は `(県名)…(数値)(単位)` を 1 つの正規表現で取っていたため、
  //   「東京都の**1人**当たり県民所得は5,204,000円」で先に「1人」を claim として消費し、
  //   lastIndex が進んだ結果 **本命の 5,204,000円 が一度も抽出されない**
  //   (2026-08-12 にコード実読で確定。誤り 4 件中 1 件しか検出できていなかった)。
  //   県名と数値を別々に走査すれば、この「アンカー消費」バグは構造的に起きない。
  const UNIT_TAIL = `(MWh|kWh|GWh|kW|MW|Wh|円|人|世帯|戸|床|件|台|校|時間|ha|㎡|kg|%|％|社|店)`;
  const prefRe = new RegExp(`(${prefPattern})(?:都|府|県)?`, "gi");
  // ★複合数値: 「4万5,897」「1億2,000万」のようにスケールを跨ぐ表記を 1 グループで取る
  const numRe = new RegExp(
    `((?:[\\d,]+(?:\\.\\d+)?\\s*(?:百万|兆|億|万|千)?)+)\\s*${UNIT_TAIL}`,
    "gi",
  );

  /** 県名の出現位置 (数値をどの県に紐づけるかの手がかり)。 */
  const prefHits = [];
  for (const pm of body.matchAll(prefRe)) {
    prefHits.push({ name: pm[1], end: pm.index + pm[0].length });
  }
  if (prefHits.length === 0) return warnings;

  /** 県名と数値がこの距離以内なら「その県の主張」とみなす (旧実装の {0,20} と同じ意図)。 */
  const PREF_PROXIMITY = 20;

  const seen = new Set();
  for (const nm of body.matchAll(numRe)) {
    // 直前で最も近い県名に紐づける。離れすぎていれば係り受け不明として捨てる
    let anchor = null;
    for (const p of prefHits) {
      if (p.end <= nm.index && nm.index - p.end <= PREF_PROXIMITY) {
        if (!anchor || p.end > anchor.end) anchor = p;
      }
    }
    if (!anchor) continue;
    // 県名から数値までに句点・改行があれば別の文 → 紐づけない
    const between = body.slice(anchor.end, nm.index);
    if (/[。\n]/.test(between)) continue;
    // 県名と数値の間に読点で区切った別の値があれば、この数値は列挙の次の地名のもの
    // (「宮崎市の3,517円、宇都宮市の2,801円」)。「1人当たり」のような指標名の中の数は区切りを伴わないので対象外
    if (new RegExp(`\\d[\\d,]*(?:\\.\\d+)?\\s*(?:百万|兆|億|万|千)?\\s*${UNIT_TAIL}\\s*[、，,]`).test(between)) continue;

    // 旧実装の m[0] 相当 (県名 〜 単位まで) を組み立てる。以降の判定はこれを使う
    const m = {
      0: body.slice(anchor.end - anchor.name.length, nm.index + nm[0].length),
      1: anchor.name,
      2: nm[1],
      3: nm[2],
      index: anchor.end - anchor.name.length,
    };
    const pref = m[1];
    const numeralRaw = m[2].trim();
    const unitTail = m[3];
    const claimBase = parseJapaneseNumeral(numeralRaw);
    if (claimBase === null) continue;

    // 派生値 (差額/比/当たり/平均/換算 等) は data の絶対 value と一致しない → WARN 対象外。
    // claim 周辺 (matched span + 直前 24 字 + 直後 16 字) に derived/per-capita マーカーがあれば skip。
    const valLead = body.slice(Math.max(0, m.index - 24), m.index);
    const valTrail = body.slice(m.index + m[0].length, m.index + m[0].length + 16);

    // ★「当たり」等が **指標名の一部** の場合は派生値ではない。
    //   `1人当たり県民所得` `1世帯当たり貯蓄額` のような指標名は gt の label に実在するので、
    //   マッチ内に既知 label があれば skip 理由から外す。これをしないと per-capita 系の
    //   指標がまるごと照合対象から消える (2026-08-12 実測: 誤り 4 件中 3 件がこれで見逃されていた)。
    const namesKnownMetric = [...knownLabels].some(
      (label) => label.length >= 3 && m[0].includes(label),
    );
    const derivedHere =
      PER_CAPITA_SKIP.test(valLead) ||
      DERIVED_VALUE_SKIP.test(valLead) ||
      DERIVED_VALUE_SKIP.test(valTrail) ||
      (!namesKnownMetric && (PER_CAPITA_SKIP.test(m[0]) || DERIVED_VALUE_SKIP.test(m[0])));
    if (derivedHere) continue;

    // この記事に ground truth が無い別指標を語っている箇所は照合できない → skip。
    // 窓は固定長ではなく **文単位** にする: 「A でも1位(10,098円)、7位の B も2位(9,799円)」のような
    // 列挙では、2 つ目以降の claim から指標名が固定窓の外に出てしまうため (2026-07-31 実測)。
    // 文脈は「文頭 〜 数値の直前」。指標名は県名より後ろに来ることがある
    // (「兵庫県はコーヒー消費支出額でも1位で10,098円」) ため、マッチ範囲の内側も含める。
    const sentenceStart = Math.max(
      body.lastIndexOf("。", m.index - 1) + 1,
      body.lastIndexOf("\n", m.index - 1) + 1,
      m.index - 200,
    );
    const beforeNumeralInMatch = m[0].slice(0, Math.max(0, m[0].lastIndexOf(m[2])));
    const metricContext = body.slice(sentenceStart, m.index) + beforeNumeralInMatch;

    // 括弧内の数値は照合対象にしない。
    // 括弧内に現れる数値は実測上ほぼ別指標か派生値であり、data の絶対値と照合できない
    // (「緑茶…静岡県(7,664円)」「3位秋田県（約3.9ha）」)。照合対象に含めると誤検出を量産する。
    // (括弧内数値そのものの是非は別問題。ranking ai-content 側にはこれを禁じるルールがあるが、
    //  blog-quality-standards.md には無い。paren-number-lint.mjs は現時点で計測のみ。)
    if (isInsideParenthesis(body, m.index + m[0].lastIndexOf(m[2]))) continue;

    // 符号付き (+145.7万円 / −15.8万円) は差分表記 → data の絶対値と一致しないので対象外。
    // markdown の強調記号は符号判定の邪魔になるので除いてから見る。
    if (SIGNED_DELTA_RE.test(beforeNumeralInMatch.replace(/[*_`\s]+$/g, "$&").replace(/[*_`]/g, ""))) {
      continue;
    }

    if (DELTA_BEFORE_RE.test(between) || DELTA_CONTEXT_RE.test(metricContext) || hasDeltaPredicateAfter(body, nm.index + nm[0].length)) continue;

    // 県の組 (「岐阜・愛知・三重」「東京・神奈川・埼玉の3都県」) の後ろの数値は組の合計で、最後の県の値ではない (MANUFACTURING-ZONE-CHART-LINEAGE-01 ③)
    if (PREF_GROUP_BEFORE_RE.test(body.slice(Math.max(0, m.index - 8), m.index)) || PREF_GROUP_BETWEEN_RE.test(between)) continue;

    if (mentionsForeignMetric(metricContext, knownLabels)) continue;

    // 県名の直後が「市」なら都市の主張、文が期間の平均を語るなら平均の系列 (52 市・複数年平均) も照合先に足す。
    // 平均を語っているのに平均の系列が data に無いなら、単年値とは照合しない (FACTUAL-CHECK-CROSS-METRIC-RANK-01)
    const cityScope = /^(?:市|区部)/.test(body.slice(anchor.end));
    const averageScope = PERIOD_AVERAGE_RE.test(metricContext);
    const scopedFacts = claimFacts(gt[pref] || [], { cityScope, averageScope });
    if (scopedFacts === null) continue;

    // 年号らしき値 (1900-2100 で単位が無いケースは上で弾く) はここでは単位付きなので通す
    // スケールは numeralRaw 側で解釈済みなので、次元は単位実体だけから取る
    const claimDim = unitDimension(unitTail);
    if (!claimDim) continue;

    const key = `${pref}:${numeralRaw}:${unitTail}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const facts = scopedFacts.filter((f) => typeof f.value === "number");
    // 次元が一致する value のみ比較対象 (単位が取れない fact は除外)
    const comparable = facts.filter((f) => {
      const dim = unitDimension(f.unit || "");
      return dim && dim === claimDim;
    });
    if (comparable.length === 0) continue; // 安全側: 比較できないなら skip

    // 許容幅は本文が書いた精度から決める。「4,790戸」は十の位まで言い切っているので ±5、「468万人」は ±0.5万。
    // 「約」などで丸めを断っているときと、精度が読めない書き方は従来の ±5% (BLOG-TUTORIAL-GATE-GAPS-01:
    // ±5% だと 4,970戸 → 4,790戸 の書き誤りが一致扱いになっていた)
    const tolerance = APPROX_BEFORE_RE.test(body.slice(Math.max(0, nm.index - 8), nm.index)) ? null : claimTolerance(numeralRaw);
    if (equalsDifferenceInParagraph(body, nm.index, nm.index + nm[0].length, claimBase, tolerance, unitTail, numRe)) continue;
    const matched = comparable.some((f) => {
      const base = factBaseValue(f);
      if (base === null || base === 0) return base === claimBase;
      if (tolerance !== null) return Math.abs(claimBase - base) <= tolerance + Math.abs(base) * 1e-9;
      const ratio = claimBase / base;
      return ratio >= 0.95 && ratio <= 1.05; // ±5%
    });
    if (matched) continue;

    // ★最近傍との乖離で WARN。旧実装は 3 倍以上しか見ておらず、**1.9 倍の誤りが無言で通っていた**
    //   (2026-08-12 実測: 5,204,000 に対する 9,999,000 は 1.92 倍で素通り)。
    //   一致判定 (±5%) を外れた時点で「data と違う」ので、そこを境にする。
    //   閾値を上げ直すのではなく、誤検知が出るなら skip 条件側を精密にするのが筋。
    const MISMATCH_RATIO = 1.05;
    let grossest = null;
    for (const f of comparable) {
      const base = factBaseValue(f);
      if (base === null || base === 0) continue;
      const r = claimBase > base ? claimBase / base : base / claimBase;
      if ((tolerance !== null || r >= MISMATCH_RATIO) && (grossest === null || r > grossest.r)) {
        grossest = { r, f };
      }
    }
    if (grossest) {
      const dataList = comparable
        .slice(0, 2)
        .map((f) => `${f.label || "?"}=${f.value}${f.unit || ""}`)
        .join(" / ");
      warnings.push(
        `VALUE_MISMATCH (要確認): 本文「${pref}...${numeralRaw}${unitTail}」` +
          ` が data と ${grossest.r.toFixed(1)}倍 乖離 → data: ${dataList}`,
      );
    }
  }
  return warnings;
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

// ============================================================================
// Correlation claim check (BLOG-TOPIC-PAIR-PER-CAPITA-01, 2026-10-28)
// ============================================================================

/**
 * 散布図の接地物 (`*-scatter.source.json` の pearsonR と `*-scatter.json` の点数) を読む。
 * 型B の prompt は同じファイルから相関係数を渡すので、本文の相関係数はこれと一致するはず。
 *
 * @param {string|null} dataDir
 * `partialRPopulation` (人口を統制した偏相関) があれば partialR として持つ。本文が「偏相関係数を計算すると r=0.71」と
 * 書くとき、`(?<!偏)` では r= の形を外せないため、既知の値として照合する (2026-10-28 に公開記事の誤検知 4 件の原因)。
 *
 * @returns {{file: string, pearsonR: number, partialR: number|null, pointCount: number|null}[]}
 */
export function loadCorrelationFacts(dataDir) {
  if (!dataDir || !fs.existsSync(dataDir)) return [];
  const facts = [];
  for (const file of fs.readdirSync(dataDir)) {
    if (!file.endsWith("-scatter.source.json")) continue;
    try {
      const source = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
      if (typeof source.pearsonR !== "number" || !Number.isFinite(source.pearsonR)) continue;
      let pointCount = null;
      const scatterPath = path.join(dataDir, file.replace(/\.source\.json$/, ".json"));
      if (fs.existsSync(scatterPath)) {
        const scatter = JSON.parse(fs.readFileSync(scatterPath, "utf8"));
        if (Array.isArray(scatter.points)) pointCount = scatter.points.length;
      }
      const partialR =
        typeof source.partialRPopulation === "number" && Number.isFinite(source.partialRPopulation)
          ? source.partialRPopulation
          : null;
      facts.push({ file, pearsonR: source.pearsonR, partialR, pointCount });
    } catch {
      // 壊れた JSON は照合材料にしない (下で「照合先なし」として警告に倒れる)
    }
  }
  return facts;
}

// 「相関係数は−0.71」「相関係数が約0.7」「r=0.71」。符号は半角/全角ハイフン・マイナス記号・「マイナス」
const CORRELATION_CLAIM_RE =
  /(?:(?<!偏)相関係数|(?<![A-Za-z])r\s*[=＝])[^0-9０-９\n。−\-－]{0,6}?(マイナス\s*|[−\-－]\s*)?([0-9]*[.．][0-9]+)/g;
// 相関を語る文の「46県」「46都道府県」(対象県数の主張)
const CORRELATION_COUNT_RE = /([0-9]+)\s*(?:都道府県|県)/g;

/**
 * 本文の相関係数を散布図の接地物と照合する。
 * - 本文の値が、書かれた小数桁で丸めたどの相関係数とも一致しない → warning
 *   (unit-semantics-standards.md §5 の段階導入。2026-10-28 に公開 609 記事を走査し、相関係数を書く 91 記事中
 *   7 記事で発火した。散布図に無い別の相関 (部分集合・別指標) を語る文も拾うため、blocker にすると
 *   正しい記事の是正を止める。照合先の無い 54 記事は CORRELATION_NO_TRUTH。2026-10-28 に 7 記事の 20 件を文ごとに
 *   確かめ、散布図の相関の誤りは 0 件・全件が別の相関 (部分集合・偏相関・順位相関・別指標・別の年) だった。
 *   偏相関 4 件は partialR で解消したが、残りは文面から機械で区別できないので warning のままにする)
 * - 相関係数を書いているのに照合先 (pearsonR を持つ source.json) が無い → warning
 * - 相関係数と同じ文の「N県」が点数とも 47 とも違う → warning (順位の話と混ざるため blocker にしない)
 *
 * @param {string} content - article.md の全文
 * @param {{pearsonR: number, partialR?: number|null, pointCount: number|null}[]} facts
 * @returns {{blockers: string[], warnings: string[]}}
 */
export function checkCorrelationClaims(content, facts) {
  const blockers = [];
  const warnings = [];
  const body = content
    .replace(/^---[\s\S]*?\n---\n/, "")
    .replace(/```[\s\S]*?```/g, "");
  const sentences = body.split(/(?<=[。\n])/);
  for (const sentence of sentences) {
    CORRELATION_CLAIM_RE.lastIndex = 0;
    let m;
    let hasClaim = false;
    while ((m = CORRELATION_CLAIM_RE.exec(sentence)) !== null) {
      hasClaim = true;
      const digits = m[2].replace("．", ".");
      const decimals = digits.split(".")[1].length;
      const stated = (m[1] ? -1 : 1) * Number(digits);
      if (facts.length === 0) {
        warnings.push(`CORRELATION_NO_TRUTH: 相関係数 ${m[0].trim()} を照合する散布図の source.json (pearsonR) が無い`);
        continue;
      }
      const known = facts.flatMap((f) => (f.partialR == null ? [f.pearsonR] : [f.pearsonR, f.partialR]));
      const ok = known.some((r) => Math.abs(Number(r.toFixed(decimals)) - stated) < 1e-9);
      if (!ok) {
        const truth = facts.map((f) => f.pearsonR.toFixed(decimals)).join(" / ");
        warnings.push(`CORRELATION_MISMATCH: 本文の相関係数 ${stated} が散布図の値 ${truth} と一致しない (「${m[0].trim()}」)`);
      }
    }
    if (!hasClaim || facts.length === 0) continue;
    const counts = new Set(facts.map((f) => f.pointCount).filter((n) => n != null));
    if (counts.size === 0) continue;
    CORRELATION_COUNT_RE.lastIndex = 0;
    let c;
    while ((c = CORRELATION_COUNT_RE.exec(sentence)) !== null) {
      const n = Number(c[1]);
      if (n !== 47 && !counts.has(n)) {
        warnings.push(`CORRELATION_COUNT_MISMATCH: 相関の文の「${c[0]}」が散布図の点数 ${[...counts].join(" / ")} と違う`);
      }
    }
  }
  return { blockers, warnings };
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

  // 相関係数は県別の ground truth と独立に照合する (散布図の source.json が照合先)
  const correlation = checkCorrelationClaims(articleContent, loadCorrelationFacts(dataDir));
  blockers.push(...correlation.blockers);
  warnings.push(...correlation.warnings);

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

  // Value claim cross-check (Phase C, 2026-05-28) — WARN のみ (単位ずれ誤検出を避けるため blocker にしない)
  warnings.push(...checkValueClaims(articleContent, groundTruth));

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
