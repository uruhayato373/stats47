// note 家計シリーズ (a-kakei-<pref>) の本文テンプレを決定的に生成する純関数群 (LLM不使用)。
//
// 仕様: WP4 spec (十大費目の偏り・47県マップ・突出品目・根拠指標・出典の5画像+定型文構成)。
// 数字は chart-data.json / evidence-data.json 由来のみで、fmt* 群がその唯一の書式変換経路。
// lib/kakei-note-audit.mjs はここの fmt*/splitCategoryGroups/buildDescription を再利用し、
// 生成と監査が同じ数値表現・同じ「生成すべき description」を見るようにする。
import { createHash } from "node:crypto";

// ---------- 数値の書式 ----------

/** ratio → "1.44倍" */
export function fmtRatio(x) {
  return (Math.round(x * 100) / 100).toFixed(2) + "倍";
}

/** rank → "9位" */
export function fmtRank(rank) {
  return `${rank}位`;
}

/** unit が %/％ なら小数1桁+%、それ以外は ja-JP ロケール表記+unit */
export function fmtValue(value, unit) {
  if (unit === "%" || unit === "％") {
    return value.toFixed(1) + "%";
  }
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 1 }) + unit;
}

// 本文の最低文字数 (frontmatter・画像行・見出し記号を除いた文字数)。
// 2026-09-15: 熊本の実データで検証したところ 5 文だけの定型文では 2,200 に届かなかったため、
// 47都道府県マップ/根拠ランキングの上位・最下位を data/*.json (決定的な入力データ) から
// 追加で読み上げる文を足し、閾値は主要オーナー判断で 2,000 に調整した。
export const MIN_BODY_CHARS = 2000;

const SIDE_DESC = { above: "高く", below: "低く" };
const SIDE_NOUN = { above: "高さ", below: "低さ" };

export function sideDescOf(side) {
  return SIDE_DESC[side];
}
export function sideNounOf(side) {
  return SIDE_NOUN[side];
}

// ---------- 十大費目の above/below/closest ----------

/** categoryBreakdown を above(ratio>=1, 降順) / below(ratio<1, 昇順) / closest(|ratio-1|最小) に分ける */
export function splitCategoryGroups(categoryBreakdown) {
  const above = categoryBreakdown.filter((c) => c.ratio >= 1).sort((a, b) => b.ratio - a.ratio);
  const below = categoryBreakdown.filter((c) => c.ratio < 1).sort((a, b) => a.ratio - b.ratio);
  const closest = categoryBreakdown.reduce(
    (best, cur) => (Math.abs(cur.ratio - 1) < Math.abs(best.ratio - 1) ? cur : best),
    categoryBreakdown[0],
  );
  return { above, below, closest };
}

const listJoin = (items, fmt) => items.map(fmt).join("、");
const catLabel = (c) => `${c.catName}(${fmtRatio(c.ratio)})`;
const itemLabel = (it) => `${it.name}(${fmtRatio(it.ratio)})`;

// ---------- 定型文ブロック ----------

export function buildIntro({ pref, city, year, dominant }) {
  const p1 = `${pref}の県庁所在地・${city}の家計を、総務省「家計調査」(${year}年・二人以上の世帯)で十大費目に分けて見ると、47都道府県庁所在市の単純平均を1.00としたとき、最も乖離が大きいのは${dominant.catName}の${fmtRatio(dominant.ratio)}です。`;
  const p2 = `この記事では、十大費目の偏り、47県の中での${city}の位置、突出した個別品目、そして${dominant.catName}の${sideDescOf(dominant.side)}なる背景を他の都道府県統計で確かめる、という順で${city}の家計を読み解きます。比率はすべて47市平均に対する倍率で、家計調査が公表する全国平均とは基準が異なります。`;
  const p3 = `十大費目とは食料、住居、光熱・水道、家具・家事用品、被服及び履物、保健医療、交通・通信、教育、教養娯楽、その他の消費支出の10区分で、家計調査が消費支出を分類する最上位の区分です。`;
  return [p1, p2, p3];
}

export function buildPCategories({ chartData, dominant }) {
  const { above, below, closest } = splitCategoryGroups(chartData.categoryBreakdown);
  const sentences = [];
  if (above.length > 0) {
    sentences.push(`47市平均を上回るのは${above.length}費目で、${listJoin(above, catLabel)}です。`);
  }
  if (below.length > 0) {
    sentences.push(`下回るのは${below.length}費目で、${listJoin(below, catLabel)}です。`);
  }
  sentences.push(
    `最も大きく離れているのは${dominant.catName}の${fmtRatio(dominant.ratio)}、最も平均に近いのは${closest.catName}の${fmtRatio(closest.ratio)}で、${dominant.city}の家計は${dominant.catName}に${sideDescOf(dominant.side)}偏った構造だとわかります。`,
  );
  return sentences.join("");
}

/** shareRanking: data/<shareMetricKey>-tile-grid.json の parsed 本体 ({unit, data:[{areaName,value,rank},...]}) */
export function buildPMap({ dominant, pref, shareRanking }) {
  const rows = shareRanking.data;
  const unit = shareRanking.unit;
  const top1 = rows[0];
  const top2 = rows[1];
  const top3 = rows[2];
  const bottom1 = rows[rows.length - 1];
  const s1 = `上の地図は、消費支出に占める${dominant.catName}の割合(${dominant.shareTitle})を47都道府県で比べたもので、${pref}は${fmtRank(dominant.rank)}(${fmtValue(dominant.value, dominant.unit)})です。`;
  const s1b = `割合が最も高いのは${top1.areaName}(${fmtValue(top1.value, unit)})、次いで${top2.areaName}(${fmtValue(top2.value, unit)})、${top3.areaName}(${fmtValue(top3.value, unit)})で、最も低いのは${bottom1.areaName}(${fmtValue(bottom1.value, unit)})です。`;
  const s2 = `倍率は「47市平均に対して何倍か」、地図の順位は「支出全体に占める割合が大きい順」なので、同じ費目でも見方が違います。倍率が高くても割合の順位が中位にとどまる場合は、他の費目も同じように多いことを意味します。`;
  const s3 = `全国ランキングの詳細は[${dominant.shareTitle}](${dominant.rankingUrl})で確認できます。`;
  return s1 + s1b + s2 + s3;
}

export function buildPItems({ chartData, city }) {
  const top10 = chartData.topRatioItems;
  const bottom10 = chartData.bottomRatioItems;
  const top1 = chartData.topRatioItems[0];
  const bottom1 = chartData.bottomRatioItems[0];
  const bottom1Pct = Math.round(bottom1.ratio * 100);
  const s1 = `品目別に見ると、47市平均より多い側の上位10品目は${listJoin(top10, itemLabel)}です。`;
  const s2 = `少ない側の10品目は${listJoin(bottom10, itemLabel)}で、平均の${bottom1Pct}%程度にとどまる品目もあります。`;
  const s3 = `多い側の1位である${top1.name}と、少ない側の1位である${bottom1.name}が、${city}の暮らしを最も端的に表す品目です。`;
  const s4 = `品目の倍率は世帯あたりの年間支出額を47市平均で割ったもので、購入頻度の低い品目ほど年ごとの振れが大きい点には注意が必要です。`;
  return s1 + s2 + s3 + s4;
}

function verdictSentence({ ev, pref, dominant }) {
  const rankStr = fmtRank(ev.rank);
  const valStr = fmtValue(ev.value, ev.unit);
  if (ev.verdict === "strong") {
    return `${ev.title}は${pref}が全国${rankStr}(${valStr}、${ev.year}年)で、${dominant.catName}が${sideDescOf(dominant.side)}なることと整合します。`;
  }
  if (ev.verdict === "weak") {
    return `${ev.title}は${pref}が全国${rankStr}(${valStr}、${ev.year}年)で中位にあり、${dominant.catName}の${sideDescOf(dominant.side)}なる理由としては説明力が弱い指標です。`;
  }
  return `${ev.title}は${pref}が全国${rankStr}(${valStr}、${ev.year}年)で、${dominant.catName}の偏りとは逆方向にあり、この指標では説明できません。`;
}

/** ranking: data/<metricKey>-prefecture-rankings.json の parsed 本体 ({unit, data:[{areaName,value,rank},...]}) */
export function buildPEvidence({ ev, pref, dominant, ranking }) {
  const s1 = verdictSentence({ ev, pref, dominant });
  const rows = ranking.data;
  const unit = ranking.unit;
  const top1 = rows[0];
  const last = rows[rows.length - 1];
  const s1b = `全国${fmtRank(top1.rank)}は${top1.areaName}(${fmtValue(top1.value, unit)})、最下位は${last.areaName}(${fmtValue(last.value, unit)})です。`;
  const s2 = `順位は値が大きい順で、全国ランキングは[${ev.title}](${ev.rankingUrl})で確認できます。`;
  return s1 + s1b + s2;
}

export const P_CAVEAT =
  "ここで示した対応関係は同じ年次の都道府県統計を並べた相関であり、因果の証明ではありません。家計調査の県庁所在市データは標本が小さく、年ごとの変動も大きいため、複数年・複数指標で確かめることを前提に読んでください。倍率の分母は47都道府県庁所在市の単純平均で、東京都区部や政令市の重みづけはしていません。順位は同じ値の県を小さい方の順位にそろえています。";

export function buildPSources({ year, city, evidence }) {
  return `本記事の数値は総務省統計局「家計調査」(${year}年、二人以上の世帯)にもとづきます。都道府県の値は県全体ではなく県庁所在市である${city}の世帯を対象にした数値で、比率の基準は47都道府県庁所在市の単純平均を1.00としたものです。裏付けに使った${evidence[0].title}と${evidence[1].title}は stats47 のランキングページ(出典は各ページに記載)から取得しました。`;
}

export function buildDescription({ chartData, evidenceData, pref, city }) {
  const dominant = evidenceData.dominant;
  const top1 = chartData.topRatioItems[0].name;
  const top2 = chartData.topRatioItems[1].name;
  const ev1Title = evidenceData.evidence[0].title;
  return `${city}の家計は47市平均に比べ${dominant.catName}が${fmtRatio(dominant.ratio)}と最も${sideDescOf(dominant.side)}、品目では${top1}や${top2}が目立ちます。家計調査と${ev1Title}などの都道府県統計で背景を確かめます。`;
}

// ---------- 本文組み立て ----------

/** 画像行の5枚 (順序固定)。監査の images check と名前生成ロジックを共有する。 */
export function imageNames(evidenceData) {
  const dominant = evidenceData.dominant;
  const [ev1, ev2] = evidenceData.evidence;
  return {
    categoryRatio: "category-ratio",
    shareTileGrid: `${dominant.shareMetricKey}-tile-grid`,
    extremeItems: "extreme-items",
    ev1Ranking: `${ev1.metricKey}-prefecture-rankings`,
    ev2Ranking: `${ev2.metricKey}-prefecture-rankings`,
  };
}

/**
 * shareRanking / ev1Ranking / ev2Ranking は data/*.json の parsed 本体 (下記CLIが読んで渡す):
 *   - shareRanking: data/<dominant.shareMetricKey>-tile-grid.json
 *   - ev1Ranking:    data/<ev1.metricKey>-prefecture-rankings.json
 *   - ev2Ranking:    data/<ev2.metricKey>-prefecture-rankings.json
 */
export function buildBody({ chartData, evidenceData, shareRanking, ev1Ranking, ev2Ranking }) {
  const pref = evidenceData._meta.prefName;
  const city = evidenceData._meta.cityName;
  const year = String(chartData._meta.year);
  const dominant = { ...evidenceData.dominant, city };
  const [ev1, ev2] = evidenceData.evidence;
  if (!ev1 || !ev2) throw new Error("evidence-data.json に根拠指標が2件必要");
  if (!shareRanking || !ev1Ranking || !ev2Ranking) {
    throw new Error("shareRanking/ev1Ranking/ev2Ranking (data/*.json) が必要");
  }
  const names = imageNames(evidenceData);

  const [introP1, introP2, introP3] = buildIntro({ pref, city, year, dominant });
  const pCategories = buildPCategories({ chartData, dominant });
  const pMap = buildPMap({ dominant, pref, shareRanking });
  const pItems = buildPItems({ chartData, city });
  const pEv1 = buildPEvidence({ ev: ev1, pref, dominant, ranking: ev1Ranking });
  const pEv2 = buildPEvidence({ ev: ev2, pref, dominant, ranking: ev2Ranking });
  const pSources = buildPSources({ year, city, evidence: [ev1, ev2] });

  const blocks = [
    introP1,
    introP2,
    introP3,
    `## 十大費目にみる${city}の家計の偏り`,
    `![大分類別の47県庁所在市平均との比率](images/${names.categoryRatio}.png)`,
    pCategories,
    `![${dominant.shareTitle}の47都道府県マップ](images/${names.shareTileGrid}.png)`,
    pMap,
    `## 突出した品目にみる暮らしの実像`,
    `![47県庁所在市平均と比べて特徴的な品目](images/${names.extremeItems}.png)`,
    pItems,
    `## ${dominant.catName}の${sideNounOf(dominant.side)}を他の統計で確かめる`,
    `![${ev1.title}の都道府県ランキング](images/${names.ev1Ranking}.png)`,
    pEv1,
    `![${ev2.title}の都道府県ランキング](images/${names.ev2Ranking}.png)`,
    pEv2,
    P_CAVEAT,
    `## データの出典`,
    pSources,
  ];
  return blocks.join("\n\n");
}

// ---------- frontmatter ----------

export function extractFrontmatter(markdown) {
  const m = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return null;
  return { raw: m[1], full: m[0] };
}

export function extractFrontmatterField(raw, field) {
  const re = new RegExp(`^${field}:\\s*(?:"(.*)"|'(.*)'|(.*))\\s*$`, "m");
  const m = raw.match(re);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? "";
}

export function replaceDescription(raw, newDescription) {
  const escaped = newDescription.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const re = /^description:.*$/m;
  if (!re.test(raw)) throw new Error("frontmatter に description フィールドが無い");
  return raw.replace(re, `description: "${escaped}"`);
}

export function titleSha256(title) {
  return createHash("sha256").update(title, "utf8").digest("hex");
}

/**
 * chart-data.json + evidence-data.json + 既存 draft.md から新しい draft.md 本文を組み立てる。
 * title の sha256 が evidence-data._meta.titleSha と一致しなければ書き込ませない ({ok:false} を返す)。
 */
export function buildDraft({
  chartData,
  evidenceData,
  existingMarkdown,
  shareRanking,
  ev1Ranking,
  ev2Ranking,
}) {
  const fm = extractFrontmatter(existingMarkdown);
  if (!fm) return { ok: false, reason: "frontmatter-missing" };
  const title = extractFrontmatterField(fm.raw, "title");
  if (!title) return { ok: false, reason: "title-missing" };
  const actualSha = titleSha256(title);
  const expectedSha = evidenceData?._meta?.titleSha;
  if (actualSha !== expectedSha) {
    return { ok: false, reason: "title-sha-mismatch", actualSha, expectedSha };
  }

  const pref = evidenceData._meta.prefName;
  const city = evidenceData._meta.cityName;
  const description = buildDescription({ chartData, evidenceData, pref, city });
  const newRaw = replaceDescription(fm.raw, description);
  const body = buildBody({ chartData, evidenceData, shareRanking, ev1Ranking, ev2Ranking });
  const markdown = `---\n${newRaw}\n---\n\n${body}\n`;
  return { ok: true, markdown, description, body };
}
