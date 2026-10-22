import type {
  MunicipalityRankingItemSnapshot,
  MunicipalityRankingValue,
  MunicipalityRankingValuesSnapshot,
} from '../types/municipality-snapshot';

/**
 * 市区町村ランキングの解説 (MUNI-AI-CONTENT-01)。
 *
 * 都道府県の ai-content (`app/ranking/<key>/ai-content.json`) とはスキーマも監査も別にする
 * (`ranking-content-standards.md` §スコープ境界)。1,700 余りの自治体に 1 件ずつの解説は成立しないので、
 * 上位・下位の要約、県ごとの分布、比べている自治体の範囲 (母集団と除外)、よくある質問で構成する。
 *
 * 本文に書いてよい数値は、配信値から決定的に作る「事実」(`buildMunicipalityAiFacts`) と、
 * 本文に名前の出てくる自治体の値・順位と、指標の定義文に出てくる数だけ。それ以外の数があれば公開しない。
 */
export interface MunicipalityAiContent {
  schemaVersion: 1;
  rankingKey: string;
  /** どの配信値を見て書いたか。年か件数が変われば書き直すまで公開しない。 */
  basedOn: { yearCode: string; valueCount: number };
  /** 上位・下位の要約 */
  summary: string;
  /** 県ごとの分布の読み方 */
  prefectureDistribution: string;
  /** 比べている自治体の範囲と、順位に入らない自治体 */
  population: string;
  faq: Array<{ question: string; answer: string }>;
}

export interface MunicipalityAiFactEntry {
  rank: number;
  areaName: string;
  value: number;
}

export interface MunicipalityAiFacts {
  rankingKey: string;
  title: string;
  unit: string;
  yearCode: string;
  yearName: string;
  valueCount: number;
  entityCount: number;
  excludedEntityCount: number;
  top: MunicipalityAiFactEntry[];
  bottom: MunicipalityAiFactEntry[];
  median: number;
  positiveCount: number;
  negativeCount: number;
  zeroCount: number;
  /** 上位・下位それぞれ TOP_SPAN 件に入った自治体の県ごとの数 (多い順) */
  prefectureInTop: Array<{ prefecture: string; count: number }>;
  prefectureInBottom: Array<{ prefecture: string; count: number }>;
  topSpan: number;
}

export const MUNICIPALITY_AI_TOP_SPAN = 100;
const FACT_LIST_SIZE = 10;

export function municipalityRankingAiContentKeyPath(rankingKey: string): string {
  return `app/municipalities/ranking/${encodeURIComponent(rankingKey)}/ai-content.json`;
}

/** 「北海道 札幌市」→「北海道」。配信値の areaName は「県名 市区町村名」。 */
function prefectureOf(value: MunicipalityRankingValue): string {
  return value.areaName.split(' ')[0] ?? value.areaName;
}

function countByPrefecture(values: readonly MunicipalityRankingValue[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(prefectureOf(value), (counts.get(prefectureOf(value)) ?? 0) + 1);
  return [...counts.entries()]
    .map(([prefecture, count]) => ({ prefecture, count }))
    .sort((a, b) => b.count - a.count || a.prefecture.localeCompare(b.prefecture, 'ja'));
}

function median(sorted: readonly number[]): number {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** 解説を書くときに使ってよい事実。配信値 (values.json / item.json) だけから決定的に作る。 */
export function buildMunicipalityAiFacts(
  item: MunicipalityRankingItemSnapshot,
  values: MunicipalityRankingValuesSnapshot
): MunicipalityAiFacts {
  const ranked = [...values.values].sort((a, b) => a.rank - b.rank || a.areaCode.localeCompare(b.areaCode));
  const toEntry = (value: MunicipalityRankingValue) => ({ rank: value.rank, areaName: value.areaName, value: value.value });
  const numbers = ranked.map((value) => value.value).sort((a, b) => a - b);
  return {
    rankingKey: values.rankingKey,
    title: item.subtitle ? `${item.title}（${item.subtitle}）` : item.title,
    unit: values.unit,
    yearCode: values.yearCode,
    yearName: values.yearName,
    valueCount: values.count,
    entityCount: item.entityCount,
    excludedEntityCount: item.excludedEntityCount,
    top: ranked.slice(0, FACT_LIST_SIZE).map(toEntry),
    bottom: ranked.slice(-FACT_LIST_SIZE).map(toEntry),
    median: numbers.length > 0 ? median(numbers) : 0,
    positiveCount: numbers.filter((value) => value > 0).length,
    negativeCount: numbers.filter((value) => value < 0).length,
    zeroCount: numbers.filter((value) => value === 0).length,
    prefectureInTop: countByPrefecture(ranked.slice(0, MUNICIPALITY_AI_TOP_SPAN)),
    prefectureInBottom: countByPrefecture(ranked.slice(-MUNICIPALITY_AI_TOP_SPAN)),
    topSpan: MUNICIPALITY_AI_TOP_SPAN,
  };
}

export interface MunicipalityAiAudit {
  blockers: string[];
  warnings: string[];
}

const SPECULATIVE = ['のはず', 'と思われる', 'だろう', 'と考えられる', '壊滅', '致命的'];
const NUMBER_PATTERN = /[-−]?\d[\d,]*(?:\.\d+)?/g;

function collectNumbers(value: unknown, out: number[]): void {
  if (typeof value === 'number' && Number.isFinite(value)) out.push(value);
  else if (Array.isArray(value)) for (const entry of value) collectNumbers(entry, out);
  else if (value && typeof value === 'object') for (const entry of Object.values(value)) collectNumbers(entry, out);
  else if (typeof value === 'string') {
    for (const match of value.matchAll(NUMBER_PATTERN)) out.push(Number(match[0].replace(/,/g, '').replace('−', '-')));
  }
}

/** 本文の数が、許された数のどれかと (本文に書いた桁で丸めて) 一致するか。符号は問わない (「34.6%減」と書くため)。 */
function matchesAllowed(token: string, allowed: readonly number[]): boolean {
  const text = token.replace(/,/g, '').replace('−', '-');
  const written = Math.abs(Number(text));
  const decimals = text.includes('.') ? text.split('.')[1].length : 0;
  const tolerance = 0.5 * 10 ** -decimals + 1e-9;
  return allowed.some((value) => Math.abs(Math.abs(value) - written) <= tolerance);
}

/**
 * 公開前の決定的な監査。blockers が 1 件でもあれば公開しない。
 * `metricText` は指標の title・subtitle・description・note (定義文に出てくる年や期間の数を許すため)。
 */
export function auditMunicipalityAiContent(
  content: MunicipalityAiContent,
  item: MunicipalityRankingItemSnapshot,
  values: MunicipalityRankingValuesSnapshot,
  metricText: readonly string[] = []
): MunicipalityAiAudit {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (content.rankingKey !== values.rankingKey) blockers.push(`rankingKey が配信値と違う: ${content.rankingKey}`);
  if (content.basedOn.yearCode !== values.yearCode)
    blockers.push(`書いたときの年 ${content.basedOn.yearCode} と配信値の年 ${values.yearCode} が違う (書き直しが要る)`);
  if (content.basedOn.valueCount !== values.count)
    blockers.push(`書いたときの件数 ${content.basedOn.valueCount} と配信値の件数 ${values.count} が違う (書き直しが要る)`);

  const texts: Array<[string, string]> = [
    ['summary', content.summary],
    ['prefectureDistribution', content.prefectureDistribution],
    ['population', content.population],
    ...content.faq.flatMap((entry, index): Array<[string, string]> => [
      [`faq[${index}].question`, entry.question],
      [`faq[${index}].answer`, entry.answer],
    ]),
  ];
  for (const [field, text] of texts) if (!text.trim()) blockers.push(`${field} が空`);
  for (const [field, min, max] of [
    ['summary', 120, 500],
    ['prefectureDistribution', 80, 400],
    ['population', 60, 300],
  ] as const) {
    const length = content[field].length;
    if (length < min || length > max) blockers.push(`${field} の長さ ${length} 字が ${min}〜${max} 字の外`);
  }
  if (content.faq.length < 3 || content.faq.length > 5) blockers.push(`faq は 3〜5 問 (現在 ${content.faq.length})`);

  // 許される数: 事実・定義文・本文に名前の出てくる自治体の値と順位
  const facts = buildMunicipalityAiFacts(item, values);
  const allowed: number[] = [];
  collectNumbers(facts, allowed);
  collectNumbers(metricText, allowed);
  const body = texts.map(([, text]) => text).join('\n');
  for (const value of values.values) {
    const shortName = value.areaName.split(' ').slice(1).join(' ');
    if (shortName && body.includes(shortName)) allowed.push(value.value, value.rank);
  }
  for (const [field, text] of texts) {
    for (const match of text.matchAll(NUMBER_PATTERN)) {
      if (!matchesAllowed(match[0], allowed)) blockers.push(`${field}: 根拠の無い数「${match[0]}」`);
    }
    for (const phrase of SPECULATIVE) if (text.includes(phrase)) blockers.push(`${field}: 推測の表現「${phrase}」`);
  }
  if (!body.includes(facts.top[0]?.areaName.split(' ').slice(1).join(' ') ?? ''))
    warnings.push('1 位の自治体に触れていない');
  return { blockers, warnings };
}

/** git に置いた解説 (data/municipality-ai-content/<key>.json) の形を確かめる。形が違えば例外。 */
export function parseMunicipalityAiContent(raw: unknown): MunicipalityAiContent {
  const value = raw as Partial<MunicipalityAiContent> | null;
  const isText = (entry: unknown): entry is string => typeof entry === 'string';
  if (
    !value ||
    value.schemaVersion !== 1 ||
    typeof value.rankingKey !== 'string' ||
    typeof value.basedOn?.yearCode !== 'string' ||
    typeof value.basedOn?.valueCount !== 'number' ||
    !isText(value.summary) ||
    !isText(value.prefectureDistribution) ||
    !isText(value.population) ||
    !Array.isArray(value.faq) ||
    !value.faq.every((entry) => isText(entry?.question) && isText(entry?.answer))
  ) {
    throw new Error('municipality ai-content の形が違う');
  }
  return value as MunicipalityAiContent;
}

/**
 * R2 に置く形 (`app/municipalities/ranking/<key>/ai-content.json`)。監査に通ったときの values.json の generatedAt を持つ。
 * values.json は中身が変わったときだけ generatedAt が変わるので、ページは一致するときだけ表示する
 * (値が改訂されて監査に落ちた回は、前回の解説が R2 に残っていても表示されない)。
 */
export interface MunicipalityAiContentSnapshot extends MunicipalityAiContent {
  valuesGeneratedAt: string;
}

export function parseMunicipalityAiContentSnapshot(raw: unknown): MunicipalityAiContentSnapshot {
  const content = parseMunicipalityAiContent(raw);
  const valuesGeneratedAt = (raw as { valuesGeneratedAt?: unknown }).valuesGeneratedAt;
  if (typeof valuesGeneratedAt !== 'string') throw new Error('municipality ai-content の valuesGeneratedAt が無い');
  return { ...content, valuesGeneratedAt };
}

/** 解説が今の配信値に対して監査済みか。 */
export function isMunicipalityAiContentCurrent(
  snapshot: MunicipalityAiContentSnapshot,
  values: Pick<MunicipalityRankingValuesSnapshot, 'generatedAt' | 'rankingKey'>
): boolean {
  return snapshot.rankingKey === values.rankingKey && snapshot.valuesGeneratedAt === values.generatedAt;
}
