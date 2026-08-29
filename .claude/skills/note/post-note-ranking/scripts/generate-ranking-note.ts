#!/usr/bin/env tsx

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../../..');
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || 'https://storage.stats47.jp';
const BLOCKER_STATE_PATH = path.join(
  PROJECT_ROOT,
  '.claude/state/content-operations/note-generation-blockers.json'
);

class GenerationBlockedError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

type RankingItem = {
  rankingKey: string;
  title: string;
  rankingName?: string;
  readerLabel?: string;
  hook?: string;
  subtitle?: string;
  description?: string;
  note?: string;
  unit: string;
  categoryKey: string;
  latestYear?: string | { yearCode?: string; yearName?: string };
};

type ValueRow = {
  areaCode: string;
  areaName: string;
  yearCode: string | number;
  value: number;
};

type RankedRow = {
  rank: number;
  area_code: string;
  area_name: string;
  year: string;
  value: number;
  deviation: number;
};

type Profile = {
  definition: string;
  highReading: string;
  lowReading: string;
  caution: string;
  nextData: string;
  categoryLabel: string;
  tags: string[];
};

const PROFILES: Record<string, Profile> = {
  'general-households': {
    definition:
      '一般世帯数は、住居と生計をともにする人の集まりや、一戸を構える単身者など、施設等の世帯を除く一般世帯の総数です。',
    highReading: '総数なので、人口規模と大都市圏への世帯集積を強く反映します。',
    lowReading:
      '値の小ささは世帯形成の少なさではなく、まず地域全体の人口規模として読みます。',
    caution:
      '世帯の人数や単身世帯の割合は分からないため、一世帯あたり人員と世帯構成を別に確認します。',
    nextData: '総人口、一世帯あたり人員、単独世帯比率、過去からの世帯数推移',
    categoryLabel: '人口',
    tags: ['一般世帯', '世帯数', '国勢調査', '人口統計'],
  },
  'room-utilization-rate': {
    definition:
      '客室稼働率は、利用可能な客室のうち実際に利用された客室の割合です。',
    highReading:
      '都市観光、業務需要、イベントなど複数の宿泊需要と、供給される客室数の関係が値に表れます。',
    lowReading:
      '低い値は観光の魅力不足とは限らず、客室供給の多さや季節変動にも左右されます。',
    caution:
      '年間平均は繁忙期と閑散期をならすため、月別・施設タイプ別の違いを隠します。',
    nextData:
      '延べ宿泊者数、客室数、月別稼働率、外国人延べ宿泊者数、宿泊施設タイプ',
    categoryLabel: '観光',
    tags: ['客室稼働率', '宿泊', '観光', 'ホテル'],
  },
  'fishery-output-value': {
    definition:
      '漁業産出額は、海面・内水面の漁業や養殖業で生産された水産物を金額で評価した総額です。',
    highReading: '漁場、魚種、養殖、生産量、価格の違いが総額に表れます。',
    lowReading:
      '海に面していない県の0値を、地域の水産物消費や流通の少なさとは解釈できません。',
    caution:
      '最下位値が0のため上位・下位倍率を定義できず、このAシリーズの生成契約では記事化を停止します。',
    nextData:
      '海面・内水面別産出額、魚種別生産量、養殖比率、価格、漁業就業者数',
    categoryLabel: '農林水産',
    tags: ['漁業産出額', '漁業', '水産業', '養殖'],
  },
  'late-elderly-medical-expense-per-insured': {
    definition:
      '後期高齢者医療費は、後期高齢者医療制度の医療費を被保険者1人あたりに換算した年額です。',
    highReading:
      '受診量、入院・外来の構成、医療提供体制、加入者の年齢構成などが重なります。',
    lowReading:
      '低い値だけで健康状態が良いとは判断できず、必要な医療へのアクセスも確認が必要です。',
    caution:
      '医療費の高低を地域の健康度や医療の質の順位に置き換えることはできません。',
    nextData: '入院・外来別医療費、受診率、1件あたり日数、年齢構成、健康寿命',
    categoryLabel: '社会保障',
    tags: ['後期高齢者', '医療費', '高齢者医療', '社会保障'],
  },
  'total-fertility-rate': {
    definition:
      '合計特殊出生率は、年齢別出生率を合計し、その年の出生状況が続くと仮定したときの女性1人あたりの出生数に相当する指標です。',
    highReading:
      '率は人口規模をならして地域を比べやすくしますが、出生数の総量とは異なります。',
    lowReading:
      '低い値の背景を個人の意識だけに求めず、年齢構成、雇用、住宅、子育て環境を分けて見ます。',
    caution:
      '単年の率は変動するため、数年間の推移と出産年齢人口の大きさを併せて確認します。',
    nextData:
      '出生数、出産年齢女性人口、初婚年齢、未婚率、保育・住宅・雇用指標',
    categoryLabel: '人口',
    tags: ['合計特殊出生率', '出生率', '少子化', '人口動態'],
  },
  'number-of-establishments-manufacturing': {
    definition:
      '製造業の事業所数は、製造業に分類される工場や加工拠点などの数です。企業数や生産額とは一致しません。',
    highReading:
      '大都市圏の市場規模と、部品・加工を含む産業集積の裾野が総数に表れます。',
    lowReading:
      '少数の大規模工場が高い生産額を生む地域もあるため、事業所数だけで産業の強さは決まりません。',
    caution:
      '2014年の過去データなので、現在の立地判断には最新の経済構造実態調査などを確認します。',
    nextData:
      '製造品出荷額、付加価値額、従業者数、事業所あたり規模、最新年の事業所数',
    categoryLabel: '商業・産業',
    tags: ['製造業', '事業所', '工場', '産業集積'],
  },
  'consumption-expenditure-multi-person-households-per-month': {
    definition:
      '消費支出は、二人以上世帯が1か月に商品やサービスへ支出した金額の平均です。',
    highReading:
      '所得、物価、世帯人数、住居費、調査月の大きな購入などが平均額に影響します。',
    lowReading:
      '支出が少ないことを節約上手や生活の苦しさのどちらか一方には決められません。',
    caution:
      '標本調査の単年平均には振れがあるため、近い順位の優劣より複数年の傾向を重視します。',
    nextData:
      '可処分所得、世帯人員、消費者物価、費目別支出、実質値、複数年平均',
    categoryLabel: '経済',
    tags: ['消費支出', '家計', '家計調査', '生活費'],
  },
  'minimum-wage-by-region': {
    definition:
      '地域別最低賃金は、都道府県ごとに定められる労働者1時間あたりの最低賃金額です。',
    highReading:
      '金額は地域の賃金・生計費・雇用事情などを踏まえた制度上の下限で、平均賃金とは異なります。',
    lowReading:
      '低い県でも実際の賃金が全員この額という意味ではなく、産業別・職種別の賃金分布があります。',
    caution:
      '適用開始日が地域で異なるため、年次比較では同じ改定年度の金額をそろえます。',
    nextData:
      '平均時給、求人賃金、物価、家賃、産業構成、最低賃金近傍の労働者割合',
    categoryLabel: '労働・賃金',
    tags: ['最低賃金', '時給', '賃金', '労働'],
  },
  'day-time-population': {
    definition:
      '昼間人口は、常住人口を基礎に通勤・通学による流入と流出を調整した日中の人口です。',
    highReading:
      '総数には常住人口の大きさが含まれるため、外部からの吸引力だけを示す値ではありません。',
    lowReading:
      '人口規模の小さい県では昼間人口も小さくなりやすく、流入・流出は比率で確認します。',
    caution:
      '観光客や買い物客など一時的な滞在者をすべて数えたリアルタイム人流ではありません。',
    nextData:
      '夜間人口、昼夜間人口比率、通勤・通学流入出、駅別乗降客数、時間帯別人流',
    categoryLabel: '人口',
    tags: ['昼間人口', '通勤', '通学', '都市圏'],
  },
  'average-temperature': {
    definition:
      '年平均気温は、各地点で観測した日々の気温を年単位で平均した値です。',
    highReading:
      '緯度、標高、海からの距離などの地理条件に加え、その年特有の天候が表れます。',
    lowReading:
      '低い値は寒さの一面を示しますが、夏の暑さや降雪量、日較差までは分かりません。',
    caution:
      '1年の値を長期的な気候そのものとせず、平年値や複数年の推移と比較します。',
    nextData:
      '平年値、月平均気温、最高・最低気温、標高、降雪量、猛暑日・真冬日',
    categoryLabel: '国土・気象',
    tags: ['年平均気温', '気温', '気象', '気候'],
  },
  'agricultural-output': {
    definition:
      '農業産出額は、都道府県内で生産された農産物の生産量に農家庭先価格を掛けて評価した金額です。',
    highReading:
      '耕地規模だけでなく、畜産、野菜、果実など品目構成と価格が総額に表れます。',
    lowReading:
      '都市部でも高付加価値の農業は存在するため、総額の小ささを農業の価値の低さとはみなしません。',
    caution:
      '価格変動でも産出額は動くため、生産量の増減と金額の増減を分けて確認します。',
    nextData:
      '品目別産出額、耕地面積、農業経営体数、生産量、農業所得、価格指数',
    categoryLabel: '農林水産',
    tags: ['農業産出額', '農業', '農産物', '地域産業'],
  },
  'agricultural-employment-population': {
    definition:
      '農業就業人口は、主として農業に従事する人の数を示す総数指標です。',
    highReading: '人口規模、農業地域の広がり、農業経営の構造が人数に表れます。',
    lowReading:
      '人数が少なくても大規模化や機械化で高い生産を行う地域があり、生産力とは一致しません。',
    caution:
      '2014年の値であり、担い手の高齢化や定義変更を含む現在の状況は最新統計で確認します。',
    nextData:
      '基幹的農業従事者、年齢構成、農業経営体数、耕地面積、農業産出額、最新年値',
    categoryLabel: '人口・農業',
    tags: ['農業就業人口', '農業従事者', '担い手', '農業人口'],
  },
  'electricity-generation-capacity': {
    definition:
      '発電電力量は、都道府県内の発電設備が一定期間に生み出した電力量です。設備容量とは異なります。',
    highReading:
      '大規模な火力・原子力・水力・再生可能エネルギー設備の立地と稼働状況が総量に表れます。',
    lowReading:
      '消費地へ県境を越えて送電されるため、発電量の少なさは電力利用の少なさや不足を意味しません。',
    caution:
      '単年値は設備点検や稼働率にも左右されるため、電源別内訳と時系列を併せて見ます。',
    nextData:
      '電源別発電量、設備容量、設備利用率、県内電力需要、送受電量、再エネ比率',
    categoryLabel: 'エネルギー',
    tags: ['発電電力量', '電力', '発電所', 'エネルギー'],
  },
  'current-liabilities-balance-multi-person-households-per-household': {
    definition:
      '負債現在高は、二人以上世帯が調査時点で抱える借入金などの残高を1世帯あたりで平均した値です。',
    highReading:
      '住宅価格と住宅ローン、世帯主の年齢、所得などが平均残高に影響します。',
    lowReading:
      '負債が少ないことだけで家計が豊かとは判断できず、資産取得や若年世帯の少なさも関係します。',
    caution:
      '家計の健全性は負債単独ではなく、資産、所得、毎月の返済負担と併せて評価します。',
    nextData:
      '資産現在高、純資産、年間収入、返済負担率、負債保有率、世帯主年齢',
    categoryLabel: '経済',
    tags: ['負債現在高', '家計', '住宅ローン', '家計資産'],
  },
  'avg-propensity-to-consume-worker-households': {
    definition:
      '平均消費性向は、勤労者世帯の可処分所得に占める消費支出の割合です。',
    highReading:
      '所得のうち消費に回った比率であり、支出額そのものの多さとは異なります。',
    lowReading:
      '低い値は貯蓄余力だけでなく、税・社会保険、住宅購入、調査時点の支出変動にも注意が必要です。',
    caution:
      '分母の可処分所得と分子の消費支出の両方で値が動くため、比率だけで節約志向を判断しません。',
    nextData:
      '可処分所得、消費支出、黒字率、貯蓄現在高、費目別支出、複数年平均',
    categoryLabel: '経済',
    tags: ['平均消費性向', '消費', '可処分所得', '勤労者世帯'],
  },
};

const REGION_BY_CODE: Array<[number, number, string]> = [
  [1, 1, '北海道'],
  [2, 7, '東北'],
  [8, 14, '関東'],
  [15, 23, '中部'],
  [24, 30, '近畿'],
  [31, 35, '中国'],
  [36, 39, '四国'],
  [40, 47, '九州・沖縄'],
];

function parseArgs() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const requireImages = args.includes('--require-images');
  const yearIndex = args.indexOf('--year');
  const year = yearIndex >= 0 ? args[yearIndex + 1] : undefined;
  const rankingKey = args.find((arg) => !arg.startsWith('--') && arg !== year);
  if (!rankingKey) {
    throw new Error(
      'Usage: npx tsx generate-ranking-note.ts <rankingKey> [--year YYYY] [--check] [--require-images]'
    );
  }
  return { rankingKey, year, check, requireImages };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return (await response.json()) as T;
}

type BlockerState = {
  version: 1;
  updatedAt: string;
  blockers: Record<string, { code: string; message: string; source: string }>;
};

async function readBlockerState(): Promise<BlockerState> {
  try {
    return JSON.parse(
      await readFile(BLOCKER_STATE_PATH, 'utf8')
    ) as BlockerState;
  } catch {
    return { version: 1, updatedAt: new Date(0).toISOString(), blockers: {} };
  }
}

async function setBlocker(
  rankingKey: string,
  blocker: { code: string; message: string; source: string } | null
): Promise<void> {
  const state = await readBlockerState();
  const existed = rankingKey in state.blockers;
  if (blocker) state.blockers[rankingKey] = blocker;
  else delete state.blockers[rankingKey];
  if (!blocker && !existed) return;
  state.updatedAt = new Date().toISOString();
  await mkdir(path.dirname(BLOCKER_STATE_PATH), { recursive: true });
  await writeFile(BLOCKER_STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

function regionOf(areaCode: string): string {
  const code = Number(String(areaCode).slice(0, 2));
  return (
    REGION_BY_CODE.find(([from, to]) => code >= from && code <= to)?.[2] ??
    '不明'
  );
}

function round(value: number, digits = 2): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function formatValue(value: number, unit: string): string {
  const maximumFractionDigits = Number.isInteger(value) ? 0 : 2;
  return `${new Intl.NumberFormat('ja-JP', { maximumFractionDigits }).format(value)}${unit}`;
}

function yamlQuote(value: string): string {
  return JSON.stringify(value);
}

function rowSentence(
  row: RankedRow,
  unit: string,
  mean: number,
  lead: string
): string {
  const difference = row.value - mean;
  const direction = difference >= 0 ? '上回り' : '下回り';
  return `${lead}${row.area_name}は${row.rank}位で、${formatValue(row.value, unit)}、偏差値は${row.deviation.toFixed(1)}です。全国平均を${formatValue(Math.abs(round(difference)), unit)}${direction}ます。`;
}

function regionalSummary(rows: RankedRow[]) {
  const grouped = new Map<string, number[]>();
  for (const row of rows) {
    const region = regionOf(row.area_code);
    grouped.set(region, [...(grouped.get(region) ?? []), row.value]);
  }
  return [...grouped.entries()]
    .map(([region, values]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2
          ? sorted[middle]
          : (sorted[middle - 1] + sorted[middle]) / 2;
      return { region, median: round(median) };
    })
    .sort((a, b) => b.median - a.median);
}

async function build(rankingKey: string, requestedYear?: string) {
  const [itemPayload, valuesPayload, rankingItemsPayload, blogPayload] =
    await Promise.all([
      fetchJson<{ item: RankingItem }>(
        `${R2_BASE}/app/ranking/${rankingKey}/item.json`
      ),
      fetchJson<{ rows: ValueRow[] }>(
        `${R2_BASE}/app/stats/${rankingKey}/values.json`
      ),
      fetchJson<{ items?: RankingItem[] }>(
        `${R2_BASE}/app/ranking-items/all.json`
      ),
      fetchJson<{ articles?: Array<{ slug: string; title: string }> }>(
        `${R2_BASE}/app/blog/all.json`
      ),
    ]);
  const item = itemPayload.item;
  const profile =
    PROFILES[rankingKey] ??
    ({
      definition:
        item.description ??
        `${item.rankingName || item.title}について、都道府県別に同じ定義で集計した値です。`,
      highReading:
        '総数・比率・平均のどれを測る指標かを確認し、値の大きさを地域の優劣へ置き換えないことが重要です。',
      lowReading:
        '低い値にも人口規模、分母、対象範囲など複数の要因があり、このランキングだけで原因は決められません。',
      caution:
        item.note ??
        '単年の順位だけで判断せず、同じ定義の時系列と関連する内訳を併せて確認します。',
      nextData:
        '指標の分子・分母、構成内訳、人口規模、同一定義の時系列、一次資料の注記',
      categoryLabel: item.categoryKey,
      tags: [
        item.readerLabel || item.title,
        item.title,
        item.categoryKey,
        '地域統計',
      ],
    } satisfies Profile);
  const latestYear =
    typeof item.latestYear === 'object'
      ? item.latestYear?.yearCode
      : item.latestYear;
  const year = String(requestedYear ?? latestYear ?? '');
  if (!year) throw new Error(`yearを決定できません: ${rankingKey}`);

  const sourceRows = valuesPayload.rows
    .filter((row) => String(row.yearCode) === year && row.value != null)
    .sort((a, b) => Number(b.value) - Number(a.value));
  if (
    sourceRows.length !== 47 ||
    new Set(sourceRows.map((row) => row.areaCode)).size !== 47
  ) {
    throw new GenerationBlockedError(
      'PREFECTURE_COVERAGE',
      `47都道府県が揃っていません: ${rankingKey}/${year} rows=${sourceRows.length}`
    );
  }
  if (sourceRows.some((row) => !Number.isFinite(Number(row.value)))) {
    throw new GenerationBlockedError(
      'INVALID_VALUE',
      `欠損または非数値があります: ${rankingKey}/${year}`
    );
  }
  const min = Number(sourceRows.at(-1)?.value);
  if (min === 0) {
    throw new GenerationBlockedError(
      'ZERO_DENOMINATOR',
      `最下位値が0のため上位/下位倍率を計算できません: ${rankingKey}/${year}`
    );
  }

  const values = sourceRows.map((row) => Number(row.value));
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const stddev = Math.sqrt(
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  );
  if (!Number.isFinite(stddev) || stddev === 0) {
    throw new GenerationBlockedError(
      'NO_VARIANCE',
      `標準偏差を計算できません: ${rankingKey}/${year}`
    );
  }
  const rows: RankedRow[] = sourceRows.map((row, index) => ({
    rank: index + 1,
    area_code: row.areaCode,
    area_name: row.areaName,
    year,
    value: Number(row.value),
    deviation: round(((Number(row.value) - mean) / stddev) * 10 + 50, 1),
  }));

  const canonicalTitle = item.rankingName || item.title;
  const readerLabel = item.readerLabel || item.title;
  const hook = item.hook || `${readerLabel}が最も多い県は？`;
  const slug = `a-${rankingKey}`;
  const outDir = path.join(PROJECT_ROOT, 'docs', '31_note記事原稿', slug);
  const localSnsDir = path.join(
    PROJECT_ROOT,
    '.local',
    'r2',
    'sns',
    'ranking',
    rankingKey
  );
  const localRankingDir = path.join(
    PROJECT_ROOT,
    '.local',
    'r2',
    'app',
    'ranking',
    rankingKey
  );
  await Promise.all([
    mkdir(outDir, { recursive: true }),
    mkdir(path.join(localSnsDir, 'instagram'), { recursive: true }),
    mkdir(path.join(localSnsDir, 'note', 'images'), { recursive: true }),
    mkdir(localRankingDir, { recursive: true }),
  ]);

  const generatedAt = new Date().toISOString();
  const ratio = round(rows[0].value / rows.at(-1)!.value, 1);
  const chartData = {
    _meta: {
      rankingKey,
      year: Number(year),
      source: 'post-note-ranking',
      generatedAt,
    },
    copy: { canonicalTitle, readerLabel, hook },
    summary: {
      mean: round(mean),
      stddev: round(stddev),
      topBottomRatio: ratio,
    },
    data: rows,
  };

  const allItems = rankingItemsPayload.items ?? [];
  const related = allItems
    .filter(
      (candidate) =>
        candidate.categoryKey === item.categoryKey &&
        candidate.rankingKey !== rankingKey
    )
    .slice(0, 3)
    .map((candidate) => ({
      key: candidate.rankingKey,
      title: candidate.readerLabel || candidate.title,
    }));
  if (related.length < 3)
    throw new Error(`関連ランキングが3件未満です: ${rankingKey}`);
  const relatedBlog = (blogPayload.articles ?? []).find((article) =>
    article.title.includes(canonicalTitle.replace(/数$|率$|額$/, ''))
  );

  const regional = regionalSummary(rows);
  const highestRegion = regional[0];
  const lowestRegion = regional.at(-1)!;
  const top = rows.slice(0, 5);
  const bottom = rows.slice(-5);
  const unit = item.unit;
  const titlePrefix = item.subtitle
    ? `【${year}年版・${item.subtitle}】`
    : `【${year}年版】`;
  const title = `${titlePrefix}${hook} 1位は${top[0].area_name}｜都道府県ランキング`;
  const topLeads = [
    '全国首位の',
    '続く',
    '上位に入った',
    '4番手の',
    '上位5県を締める',
  ];
  const bottomLeads = [
    '下位側を見ると、',
    '次に',
    '45位の',
    '46位の',
    '最下位の',
  ];
  const topParagraphs = top.map((row, index) => {
    const observation =
      index === 0
        ? profile.highReading
        : `${regionOf(row.area_code)}に位置し、同じ地域内の県と比べる視点も必要です。`;
    return `${rowSentence(row, unit, mean, topLeads[index])}${observation}この順位だけで原因を決めず、${profile.nextData}を確認すると背景を分解できます。`;
  });
  const bottomParagraphs = bottom.map((row, index) => {
    const observation =
      index === bottom.length - 1
        ? profile.lowReading
        : `${regionOf(row.area_code)}の中でも、この県の位置を周辺県と見比べることが次の手がかりです。`;
    return `${rowSentence(row, unit, mean, bottomLeads[index])}${observation}${profile.caution}`;
  });

  const linkSections = [
    `### ${readerLabel}ランキング 全都道府県版\n\nhttps://stats47.jp/ranking/${rankingKey}`,
    ...related.map(
      (entry) => `### ${entry.title}\n\nhttps://stats47.jp/ranking/${entry.key}`
    ),
  ];
  if (relatedBlog)
    linkSections.push(
      `### ${relatedBlog.title}（stats47ブログ）\n\nhttps://stats47.jp/blog/${relatedBlog.slug}`
    );

  const draft = `---
title: ${yamlQuote(title)}
description: ${yamlQuote(`${top[0].area_name}が${formatValue(top[0].value, unit)}で全国1位。最下位の${bottom.at(-1)!.area_name}は${formatValue(bottom.at(-1)!.value, unit)}。47都道府県の${readerLabel}を比較します。正式指標名は「${canonicalTitle}」です。`)}
status: draft
tags:
  - 都道府県ランキング
  - ${profile.tags[0]}
  - ${profile.tags[1]}
  - ${profile.categoryLabel}
  - stats47
  - 統計データ
  - 都道府県比較
---

${top[0].area_name}が全国1位、${bottom.at(-1)!.area_name}が47位。${readerLabel}には、同じ日本の中でも${ratio}倍の開きがあります。

首位の${top[0].area_name}は${formatValue(top[0].value, unit)}で偏差値${top[0].deviation.toFixed(1)}、最下位の${bottom.at(-1)!.area_name}は${formatValue(bottom.at(-1)!.value, unit)}で偏差値${bottom.at(-1)!.deviation.toFixed(1)}です。なぜこれほど差があるのでしょうか。

「${canonicalTitle}」は、${profile.definition}${profile.caution}

## データハイライト

全国平均: ${formatValue(round(mean), unit)}

1位: ${top[0].area_name}　${formatValue(top[0].value, unit)} / 偏差値 ${top[0].deviation.toFixed(1)}

47位: ${bottom.at(-1)!.area_name}　${formatValue(bottom.at(-1)!.value, unit)} / 偏差値 ${bottom.at(-1)!.deviation.toFixed(1)}

上位5県と下位5県の間には明確な開きがあります。一方、順位が近い県では値の差が小さい場合もあるため、一つの順位差を地域の優劣として扱わないことが大切です。

## 【コロプレス地図】日本全国の分布

<!-- note投稿時: この画像行を削除し、images/choropleth-map-1080x1080.png をアップロード -->
![${readerLabel}の都道府県分布](images/choropleth-map-1080x1080.png)

地域中央値が最も高いのは${highestRegion.region}で${formatValue(highestRegion.median, unit)}、最も低いのは${lowestRegion.region}で${formatValue(lowestRegion.median, unit)}です。県別の順位だけでなく、まとまりとして見ると分布の偏りを捉えやすくなります。

ただし、地域内にもばらつきがあります。${profile.highReading}${profile.lowReading}地図の色を原因の地図とみなさず、観測された分布として読みます。

## 上位5：分析

<!-- note投稿時: この画像行を削除し、images/chart-x-1200x630.png をアップロード -->
![${readerLabel}上位5](images/chart-x-1200x630.png)

${topParagraphs.join('\n\n')}

## 下位5：分析

${bottomParagraphs.join('\n\n')}

## あなたの県は何位？

ここまで上位・下位の10県を見てきましたが、残る37県の順位も気になるはずです。全47都道府県の順位は、色分け地図と並べ替え可能なグラフ付きでstats47から確認できます。

### ${readerLabel}ランキング 全47都道府県版

https://stats47.jp/ranking/${rankingKey}

## 地域別の傾向

<!-- note投稿時: この画像行を削除し、images/boxplot-1200x630.png をアップロード -->
![${readerLabel}の地域別傾向](images/boxplot-1200x630.png)

箱ひげ図では、${highestRegion.region}の中央値が高く、${lowestRegion.region}が低い配置です。ただし、箱の重なりや外れた県も確認し、地域名だけで各県の値を決めつけないようにします。

## このランキングを正しく読む3つの視点

**総数と比率を混同しない**

${profile.highReading}${profile.lowReading}

**順位だけで原因を決めない**

このデータから直接分かるのは、${year}年の47都道府県の値と順位です。背景を確かめるには、${profile.nextData}が必要です。

**対象年と定義を確認する**

${profile.caution}別年や別調査と比べるときは、対象となる世帯・人・施設と単位をそろえます。

## まとめ

${readerLabel}の地域差は、単純な県の優劣ではなく、指標の対象と地域条件の違いを映しています。

**首位と最下位には${ratio}倍の開き**

${top[0].area_name}の${formatValue(top[0].value, unit)}に対し、${bottom.at(-1)!.area_name}は${formatValue(bottom.at(-1)!.value, unit)}でした。まずは差の大きさを事実として押さえます。

**地域のまとまりと県内差は両方見る**

地域中央値には違いがありますが、同じ地域のすべての県が同じ傾向とは限りません。地図と全47県の順位を併用すると例外も見つけられます。

**次のデータで理由を分解する**

${profile.nextData}を重ねれば、総数・割合・価格・人口構成など、順位を動かす要素を切り分けられます。

## もっと詳しく知りたい方へ

全47都道府県の順位や、グラフ・地図での可視化はstats47で確認できます。

${linkSections.join('\n\n')}

---

**stats47** は、e-Statなどの公的統計データを47都道府県別に可視化するサービスです。ランキング・散布図・時系列チャートで、地域の違いがひと目で分かります。

https://stats47.jp
`;

  const tags = [
    '都道府県ランキング',
    '統計データ',
    '都道府県比較',
    'stats47',
    '地域格差',
    'データ分析',
    readerLabel,
    canonicalTitle,
    profile.categoryLabel,
    ...profile.tags,
    top[0].area_name,
    bottom.at(-1)!.area_name,
    `${readerLabel}ランキング`,
    `${readerLabel} 都道府県`,
    `${readerLabel} 1位`,
    `${readerLabel} 全国`,
    '地域比較',
    '公的統計',
    'e-Stat',
  ].filter((tag, index, array) => tag && array.indexOf(tag) === index);

  const provenance = {
    slug,
    vertical: 'stats47-note',
    kind: 'ranking',
    rankingKey,
    year,
    charts: [
      'images/cover-1280x670.png',
      'images/choropleth-map-1080x1080.png',
      'images/chart-x-1200x630.png',
      'images/boxplot-1200x630.png',
    ],
    source: `r2:app/stats/${rankingKey}/values.json`,
    restore: `curl -sf ${R2_BASE}/app/stats/${rankingKey}/values.json`,
    generatedBy: 'post-note-ranking',
    note: 'データ本体は stats47 R2 が SSOT。本ファイルは復元マニフェスト（コピーではない）。',
  };

  const snsData = {
    categoryName: readerLabel,
    yearName: `${year}年`,
    unit,
    data: rows.map((row) => ({
      rank: row.rank,
      areaCode: row.area_code,
      areaName: row.area_name,
      value: row.value,
    })),
  };
  const rankingItemMeta = {
    title: canonicalTitle,
    subtitle: item.subtitle || undefined,
    readerLabel,
    hook,
    unit,
  };

  await Promise.all([
    writeFile(
      path.join(outDir, 'chart-data.json'),
      `${JSON.stringify(chartData, null, 2)}\n`
    ),
    writeFile(
      path.join(outDir, 'data-provenance.json'),
      `${JSON.stringify(provenance, null, 2)}\n`
    ),
    writeFile(path.join(outDir, 'draft.md'), draft),
    writeFile(path.join(outDir, 'tags.txt'), `${tags.join('\n')}\n`),
    writeFile(
      path.join(localSnsDir, 'data.json'),
      `${JSON.stringify(snsData, null, 2)}\n`
    ),
    writeFile(
      path.join(localSnsDir, 'ranking_items.json'),
      `${JSON.stringify(rankingItemMeta, null, 2)}\n`
    ),
    writeFile(
      path.join(localSnsDir, 'instagram', 'caption.json'),
      `${JSON.stringify({ hookText: hook, displayTitle: readerLabel }, null, 2)}\n`
    ),
    writeFile(
      path.join(localRankingDir, 'item.json'),
      `${JSON.stringify(itemPayload, null, 2)}\n`
    ),
  ]);
  await setBlocker(rankingKey, null);

  console.log(
    JSON.stringify(
      {
        slug,
        rankingKey,
        year,
        rows: rows.length,
        chars: draft.length,
        links: (draft.match(/https:\/\/stats47\.jp/g) ?? []).length,
        outDir,
      },
      null,
      2
    )
  );
}

async function pngDimensions(filePath: string): Promise<[number, number]> {
  const data = await readFile(filePath);
  if (data.length < 24 || data.subarray(1, 4).toString('ascii') !== 'PNG')
    throw new Error(`PNGではありません: ${filePath}`);
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

async function check(rankingKey: string, requireImages: boolean) {
  const slug = `a-${rankingKey}`;
  const outDir = path.join(PROJECT_ROOT, 'docs', '31_note記事原稿', slug);
  const [chartDataRaw, provenanceRaw, draft, tagsRaw] = await Promise.all([
    readFile(path.join(outDir, 'chart-data.json'), 'utf8'),
    readFile(path.join(outDir, 'data-provenance.json'), 'utf8'),
    readFile(path.join(outDir, 'draft.md'), 'utf8'),
    readFile(path.join(outDir, 'tags.txt'), 'utf8'),
  ]);
  const chartData = JSON.parse(chartDataRaw) as {
    _meta: { rankingKey: string; year: number };
    copy: { hook: string };
    data: RankedRow[];
  };
  const provenance = JSON.parse(provenanceRaw) as {
    rankingKey: string;
    year: string;
    charts: string[];
    source: string;
  };
  const tags = tagsRaw.trim().split(/\r?\n/).filter(Boolean);
  const errors: string[] = [];
  if (
    chartData._meta.rankingKey !== rankingKey ||
    provenance.rankingKey !== rankingKey
  )
    errors.push('rankingKey不一致');
  if (
    chartData.data.length !== 47 ||
    new Set(chartData.data.map((row) => row.area_code)).size !== 47
  )
    errors.push('47都道府県不備');
  if (
    !draft.includes(chartData.copy.hook) ||
    !draft.includes(chartData.data[0].area_name)
  )
    errors.push('タイトル契約不一致');
  if ((draft.match(/https:\/\/stats47\.jp/g) ?? []).length < 5)
    errors.push('stats47リンクが5本未満');
  if (draft.includes('/rankings/') || /[?&]utm_/i.test(draft))
    errors.push('URL規約違反');
  if (/^\|.*\|$/m.test(draft)) errors.push('Markdown table禁止');
  if (draft.length < 2500 || draft.length > 12000)
    errors.push(`本文文字数範囲外: ${draft.length}`);
  if (tags.length > 99 || new Set(tags).size !== tags.length)
    errors.push('tags不備');
  if (!provenance.source.includes(`app/stats/${rankingKey}/values.json`))
    errors.push('provenance source不一致');

  const expected = new Map([
    ['images/cover-1280x670.png', [1280, 670]],
    ['images/choropleth-map-1080x1080.png', [1080, 1080]],
    ['images/chart-x-1200x630.png', [1200, 630]],
    ['images/boxplot-1200x630.png', [1200, 630]],
  ]);
  if (requireImages) {
    for (const [relativePath, dimensions] of expected) {
      const imagePath = path.join(outDir, relativePath);
      try {
        await stat(imagePath);
        const actual = await pngDimensions(imagePath);
        if (actual[0] !== dimensions[0] || actual[1] !== dimensions[1])
          errors.push(`${relativePath}寸法不一致: ${actual.join('x')}`);
      } catch (error) {
        errors.push(
          `${relativePath}不備: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }
  if (
    provenance.charts.length !== 4 ||
    [...expected.keys()].some((name) => !provenance.charts.includes(name))
  )
    errors.push('provenance charts不一致');

  const result = {
    rankingKey,
    pass: errors.length === 0,
    rows: chartData.data.length,
    chars: draft.length,
    tags: tags.length,
    imagesRequired: requireImages,
    errors,
  };
  console.log(JSON.stringify(result, null, 2));
  if (errors.length) process.exitCode = 1;
}

async function main() {
  const args = parseArgs();
  if (args.check) await check(args.rankingKey, args.requireImages);
  else {
    try {
      await build(args.rankingKey, args.year);
    } catch (error) {
      if (error instanceof GenerationBlockedError) {
        await setBlocker(args.rankingKey, {
          code: error.code,
          message: error.message,
          source: `r2:app/stats/${args.rankingKey}/values.json`,
        });
      }
      throw error;
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
