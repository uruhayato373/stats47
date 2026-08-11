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

/** `<base>.json` に対応する `<base>.source.json` の {label, unit} を読む (無ければ空) */
function readSourceMeta(dataDir, jsonFile) {
  const sourcePath = path.join(dataDir, jsonFile.replace(/\.json$/, ".source.json"));
  if (!fs.existsSync(sourcePath)) return {};
  try {
    const meta = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    return {
      label: typeof meta.label === "string" ? meta.label : null,
      unit: typeof meta.unit === "string" ? meta.unit : null,
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
      walkAndIndex(json, idx, file, meta.label || "", meta.unit || null);
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
    // 先頭に数字を含めない (?<![・、と\d]): 「45位 岩手県」を「5位 岩手県」と誤マッチしないため。
    // 二桁順位 (下位グループ 4X位/3X位) を一桁順位に切り詰める false positive を防ぐ。
    `(?<![・、と\\d])(\\d+)[ \\t]*位[ \\t]*(?:は|の|に|が|を|で|まで|から)?[ \\t]{0,2}(${prefPattern})(?:都|府|県)?(?![・、])`,
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
  return m ? m[1].toLowerCase() : (stripped || null);
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

    if (mentionsForeignMetric(metricContext, knownLabels)) continue;

    // 年号らしき値 (1900-2100 で単位が無いケースは上で弾く) はここでは単位付きなので通す
    // スケールは numeralRaw 側で解釈済みなので、次元は単位実体だけから取る
    const claimDim = unitDimension(unitTail);
    if (!claimDim) continue;

    const key = `${pref}:${numeralRaw}:${unitTail}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const facts = (gt[pref] || []).filter((f) => typeof f.value === "number");
    // 次元が一致する value のみ比較対象 (単位が取れない fact は除外)
    const comparable = facts.filter((f) => {
      const dim = unitDimension(f.unit || "");
      return dim && dim === claimDim;
    });
    if (comparable.length === 0) continue; // 安全側: 比較できないなら skip

    const matched = comparable.some((f) => {
      const base = factBaseValue(f);
      if (base === null || base === 0) return base === claimBase;
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
      if (r >= MISMATCH_RATIO && (grossest === null || r > grossest.r)) {
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
