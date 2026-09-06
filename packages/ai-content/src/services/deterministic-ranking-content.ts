import "server-only";

import { REGIONS, fetchPrefectures } from "@stats47/area";

import type { RankingContentInput } from "./prompts/ranking-content-prompt";

interface PrefectureRow {
  rank: number;
  areaName: string;
  value: number;
}

interface PrefectureCommentaryItem extends PrefectureRow {
  areaCode: string;
  commentary: string;
}

export interface DeterministicRankingContent {
  faq: {
    items: Array<{
      question: string;
      answer: string;
      type: "top_ranking" | "bottom_ranking" | "average" | "regional" | "custom";
    }>;
  };
  regionalAnalysis: string;
  insights: string;
  prefectureCommentary: { items: PrefectureCommentaryItem[] };
}

const PREFECTURE_COMMENTARY_MIN = 60;
const PREFECTURE_COMMENTARY_MAX = 120;

function compactLength(value: string): number {
  return value.replace(/\s/g, "").length;
}

function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? value.toLocaleString("ja-JP")
    : value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

function safeDisplayUnit(unit: string): string {
  const primary = unit.split(/[（(]/, 1)[0].trim();
  if (!primary) return "";
  if (/[0-9０-９=＝]/.test(primary)) return "";
  if (/^[百千万億兆]/.test(primary)) return "";
  return primary;
}

function formatValue(value: number, unit: string): string {
  return `${formatNumber(value)}${safeDisplayUnit(unit)}`;
}

function rankBand(rank: number, count: number): string {
  const ratio = rank / Math.max(count, 1);
  if (ratio <= 0.2) return "上位帯";
  if (ratio <= 0.4) return "上位寄りの中位帯";
  if (ratio <= 0.6) return "中位帯";
  if (ratio <= 0.8) return "下位寄りの中位帯";
  return "下位帯";
}

function compareWithAverage(value: number, average: number): string {
  const tolerance = Math.max(Math.abs(average) * 0.005, Number.EPSILON);
  if (value > average + tolerance) return "全国平均を上回る水準です";
  if (value < average - tolerance) return "全国平均を下回る水準です";
  return "全国平均に近い水準です";
}

function describeLocalPosition(position: number, count: number): string {
  if (position === 1) return "地方内では先頭です";
  if (position === count) return "地方内では末尾です";
  if (position <= Math.ceil(count / 3)) return "地方内でも上位側です";
  if (position > Math.floor((count * 2) / 3)) return "地方内では下位側です";
  return "地方内では中ほどです";
}

function describeNeighborGap(rows: PrefectureRow[], index: number): string {
  const row = rows[index];
  const neighbors = [rows[index - 1], rows[index + 1]]
    .filter((candidate): candidate is PrefectureRow => Boolean(candidate))
    .map((candidate) => ({ candidate, gap: Math.abs(candidate.value - row.value) }))
    .sort((a, b) => a.gap - b.gap);
  if (neighbors.length === 0) return "順位表の端に位置し、全体の値幅を示す地点です";
  const nearest = neighbors[0];
  const scale = Math.max(Math.abs(row.value), 1);
  return nearest.gap / scale <= 0.03
    ? `${nearest.candidate.areaName}と値が近く、順位が接近した帯にあります`
    : `${nearest.candidate.areaName}との値差があり、分布の区切りが見える位置です`;
}

function ensureCommentaryLength(value: string, index: number): string {
  let result = value;
  const supplements = [
    " 全国分布のどこに位置するかを確認しやすい県です。",
    " 順位表の中心からの距離を読む手がかりになります。",
    " 地方内順位と全国順位を併せると位置づけが明確です。",
    " 上下の順位帯へ移る境目を確かめる基準になります。",
    " 平均と順位を重ねて見る際の比較点になる県です。",
    " 地方の並びが全国分布へどう表れるかを示します。",
    " 前後の県と照らすことで値のまとまりを確認できます。",
    " 同じ順位帯の広がりを読み取る手がかりになります。",
    " 全国順位だけでは見えにくい地方内の位置も示します。",
    " 値の近い県が並ぶ範囲を確かめる比較点です。",
    " 上位側と下位側の間隔を見る際の目安になります。",
    " 平均からの離れ方と順位帯を同時に確認できます。",
  ];
  let supplementOffset = 0;
  while (compactLength(result) < PREFECTURE_COMMENTARY_MIN) {
    result += supplements[(index + supplementOffset * 5) % supplements.length];
    supplementOffset += 1;
  }
  if (compactLength(result) > PREFECTURE_COMMENTARY_MAX) {
    throw new Error(`県別解説が${PREFECTURE_COMMENTARY_MAX}字を超えました: ${result}`);
  }
  return result;
}

function buildPrefectureCommentaries(input: RankingContentInput): PrefectureCommentaryItem[] {
  const prefectures = fetchPrefectures();
  const nameToCode = new Map(prefectures.map((prefecture) => [prefecture.prefName, prefecture.prefCode]));
  const codeToRegion = new Map<string, string>();
  for (const region of REGIONS) {
    for (const code of region.prefectures) codeToRegion.set(code, region.regionName);
  }

  const rowsByRegion = new Map<string, PrefectureRow[]>();
  for (const row of input.allPrefectures) {
    const code = nameToCode.get(row.areaName);
    if (!code) throw new Error(`都道府県コードを解決できません: ${row.areaName}`);
    const regionName = codeToRegion.get(code);
    if (!regionName) throw new Error(`地方区分を解決できません: ${row.areaName}`);
    rowsByRegion.set(regionName, [...(rowsByRegion.get(regionName) ?? []), row]);
  }
  for (const [regionName, rows] of rowsByRegion) {
    rowsByRegion.set(regionName, [...rows].sort((a, b) => a.rank - b.rank));
  }

  return input.allPrefectures.map((row, index) => {
    const areaCode = nameToCode.get(row.areaName);
    if (!areaCode) throw new Error(`都道府県コードを解決できません: ${row.areaName}`);
    const regionName = codeToRegion.get(areaCode);
    if (!regionName) throw new Error(`地方区分を解決できません: ${row.areaName}`);
    const regionalRows = rowsByRegion.get(regionName) ?? [];
    const localPosition = regionalRows.findIndex((candidate) => candidate.areaName === row.areaName) + 1;
    const band = rankBand(row.rank, input.totalCount);
    const averageText = compareWithAverage(row.value, input.average);
    const localText = describeLocalPosition(localPosition, regionalRows.length);
    const gapText = describeNeighborGap(input.allPrefectures, index);
    const averageDistance = Math.abs(row.value - input.average) / Math.max(Math.abs(input.average), 1);
    const distanceText = averageDistance <= 0.05
      ? "全国平均との差はごく小さい位置です"
      : averageDistance <= 0.2
        ? "全国平均との差は比較的小さい位置です"
        : "全国平均との差が明確な位置です";
    const sameRankCount = input.allPrefectures.filter((candidate) => candidate.rank === row.rank).length;
    const tieText = sameRankCount > 1
      ? `同じ全国順位に${sameRankCount}県が並びます`
      : "同順位のない単独の位置です";
    const valueText = `値は${formatValue(row.value, input.unit)}です`;
    const variants = [
      `全国${row.rank}位で${band}です。${valueText}。${averageText}。${regionName}では${localPosition}番手です。`,
      `${regionName}では${localPosition}番手となり、${localText}。全国順位は${row.rank}位の${band}で、${gapText}。`,
      `${valueText}。${distanceText}。全国${row.rank}位の${band}で、${gapText}。`,
      `${gapText}。${regionName}内は${localPosition}番手です。全国では${row.rank}位の${band}に入ります。`,
      `${averageText}。全国順位は${row.rank}位で${band}にあたり、${tieText}。`,
      `${localText}。${valueText}。全国では${band}となる${row.rank}位です。`,
      `${gapText}。${distanceText}。全国${row.rank}位の${band}に位置します。`,
      `${averageText}。${regionName}では${localPosition}番手で、${tieText}。全国順位は${row.rank}位です。`,
      `${valueText}。全国${row.rank}位の${band}に入り、${gapText}。`,
      `${gapText}。${averageText}。${regionName}では${localPosition}番手で、全国順位は${row.rank}位です。`,
      `全国${row.rank}位の${band}です。${distanceText}。${regionName}では${localPosition}番手となり、${localText}。`,
      `${regionName}の中では${localPosition}番手です。全国${row.rank}位の${band}で、${valueText}。${averageText}。`,
    ];
    return {
      areaCode,
      areaName: row.areaName,
      rank: row.rank,
      value: row.value,
      commentary: ensureCommentaryLength(variants[index % variants.length], index),
    };
  });
}

function buildRegionalAnalysis(input: RankingContentInput): string {
  const prefectures = fetchPrefectures();
  const codeToName = new Map(prefectures.map((prefecture) => [prefecture.prefCode, prefecture.prefName]));
  const byName = new Map(input.allPrefectures.map((row) => [row.areaName, row]));

  return REGIONS.map((region) => {
    const rows = region.prefectures
      .map((code) => byName.get(codeToName.get(code) ?? ""))
      .filter((row): row is PrefectureRow => Boolean(row))
      .sort((a, b) => a.rank - b.rank);
    if (rows.length === 0) return `## ${region.regionName}\nこの地方に該当する観測値はありません。`;
    const first = rows[0];
    const last = rows[rows.length - 1];
    const above = rows.filter((row) => row.value > input.average).length;
    const below = rows.filter((row) => row.value < input.average).length;
    const range = last.rank - first.rank;
    const spreadText = range <= 10
      ? "全国順位は比較的まとまっており、地方内の県が近い順位帯に集まっています"
      : range <= 25
        ? "全国順位には一定の幅があり、地方内でも上位側と下位側に分かれています"
        : "全国順位の幅が大きく、地方を一つの傾向だけで捉えにくい分布です";
    const averagePattern = above > 0 && below > 0
      ? "全国平均の上側と下側に県が分かれます"
      : above > 0
        ? "地方内の全県が全国平均以上です"
        : "地方内の全県が全国平均以下です";
    return `## ${region.regionName}\n地方内では${first.areaName}が全国${first.rank}位の${formatValue(first.value, input.unit)}で先頭です。${averagePattern}。${last.areaName}までの並びを見ると、${spreadText}。地方内にも差があり、全国分布の中で一様ではないことが読み取れます。`;
  }).join("\n\n");
}

function buildInsights(input: RankingContentInput): string {
  const rows = input.allPrefectures;
  const top = rows[0];
  const bottom = rows[rows.length - 1];
  const middle = rows[Math.floor((rows.length - 1) / 2)];
  const above = rows.filter((row) => row.value > input.average).length;
  const below = rows.filter((row) => row.value < input.average).length;
  const difference = Math.abs(input.max - input.min);
  const ratioText = input.min > 0
    ? `最大値は最小値の約${formatNumber(input.max / input.min)}倍です。`
    : "最小値がゼロ以下なので倍率ではなく差で見る必要があります。";
  const topFive = rows.slice(0, 5).reduce((sum, row) => sum + row.value, 0);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const shareText = total > 0 && topFive >= 0 && topFive <= total
    ? `上位5県の値の合計は${formatValue(topFive, input.unit)}で、全体の約${formatNumber((topFive / total) * 100)}％です。`
    : `上位5県の値の合計は${formatValue(topFive, input.unit)}です。値にゼロ以下を含む場合、構成比だけでは集中度を適切に表せません。`;

  return `## 値の広がり\n1位の${top.areaName}は${formatValue(top.value, input.unit)}、最下位の${bottom.areaName}は${formatValue(bottom.value, input.unit)}です。最大値と最小値の差は${formatValue(difference, input.unit)}で、${ratioText}順位だけでなく値幅も確認すると、分布の広がりを捉えやすくなります。\n\n## 平均との関係\n全国平均は${formatValue(input.average, input.unit)}です。平均を上回る県は${above}県、下回る県は${below}県で、平均付近に全県が均等に並ぶわけではありません。平均から上下に分かれる県数を比べると、分布の偏りを順位表とは別の角度から確認できます。\n\n## 中位帯の厚み\n観測行の中央にある${middle.areaName}は全国${middle.rank}位で${formatValue(middle.value, input.unit)}です。中位の値と平均の距離や、周辺に同順位の県が集まるかを併せて見ると、上位と下位だけでは分からない分布の中心と密集度が明確になります。\n\n## 上位層の集中\n${shareText}上位層の合計と全体の関係を確認すると、少数県への集中が強い指標か、幅広い県に値が分散する指標かを読み分けられます。地域別の並びとは異なる、全国横断の集計として見ることが重要です。`;
}

function buildFaq(input: RankingContentInput): DeterministicRankingContent["faq"] {
  const rows = input.allPrefectures;
  const top = rows[0];
  const bottom = rows[rows.length - 1];
  const topRank = Math.min(...rows.map((row) => row.rank));
  const bottomRank = Math.max(...rows.map((row) => row.rank));
  const topRows = rows.filter((row) => row.rank === topRank);
  const bottomRows = rows.filter((row) => row.rank === bottomRank);
  const above = rows.filter((row) => row.value > input.average).length;
  const below = rows.filter((row) => row.value < input.average).length;
  const difference = Math.abs(input.max - input.min);
  const ratio = input.min > 0 ? `、倍率は約${formatNumber(input.max / input.min)}倍` : "";

  const prefectures = fetchPrefectures();
  const nameToCode = new Map(prefectures.map((prefecture) => [prefecture.prefName, prefecture.prefCode]));
  const codeToRegion = new Map<string, string>();
  for (const region of REGIONS) {
    for (const code of region.prefectures) codeToRegion.set(code, region.regionName);
  }
  const topRegions = [...new Set(
    topRows
      .map((row) => nameToCode.get(row.areaName))
      .map((code) => codeToRegion.get(code ?? ""))
      .filter((regionName): regionName is string => Boolean(regionName)),
  )];

  return {
    items: [
      {
        question: `${input.rankingName}で1位の都道府県はどこですか？`,
        answer: topRows.length === 1
          ? `${input.yearCode}年度の1位は${top.areaName}で、値は${formatValue(top.value, input.unit)}です。`
          : `${input.yearCode}年度の1位は${topRows.map((row) => row.areaName).join("・")}で、値はいずれも${formatValue(topRows[0].value, input.unit)}です。`,
        type: "top_ranking",
      },
      {
        question: `${input.rankingName}で最下位の都道府県はどこですか？`,
        answer: bottomRows.length === 1
          ? `最下位は${bottom.areaName}で、値は${formatValue(bottom.value, input.unit)}です。`
          : `最下位は${bottomRows.map((row) => row.areaName).join("・")}で、値はいずれも${formatValue(bottomRows[0].value, input.unit)}です。`,
        type: "bottom_ranking",
      },
      {
        question: `${input.rankingName}の全国平均はいくつですか？`,
        answer: `全国平均は${formatValue(input.average, input.unit)}です。平均を上回る県は${above}県、下回る県は${below}県です。`,
        type: "average",
      },
      {
        question: `${input.rankingName}は地域ごとにどのような傾向がありますか？`,
        answer: `全国1位の県を含む地方区分は${topRegions.join("・") || "該当なし"}です。7地方区分の各節では、地方内の先頭県と順位の広がりを確認できます。`,
        type: "regional",
      },
      {
        question: `${input.rankingName}の最大値と最小値の差はどのくらいですか？`,
        answer: `最大値と最小値の差は${formatValue(difference, input.unit)}${ratio}です。`,
        type: "custom",
      },
    ],
  };
}

export function buildDeterministicRankingContent(
  input: RankingContentInput,
): DeterministicRankingContent {
  if (input.allPrefectures.length === 0) throw new Error("都道府県データが空です");
  return {
    faq: buildFaq(input),
    regionalAnalysis: buildRegionalAnalysis(input),
    insights: buildInsights(input),
    prefectureCommentary: { items: buildPrefectureCommentaries(input) },
  };
}
