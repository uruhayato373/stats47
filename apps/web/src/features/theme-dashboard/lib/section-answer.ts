import { formatUnitForDisplay } from '@stats47/data-configs/unit';

import { formatMetricValue, type MetricKpi } from '../components/metric-kpi';

/** 全国との差がこの割合未満なら「ほぼ同じ」と書く (丸めた値の差を多い・少ないと言わない) */
const SAME_AS_NATIONAL_RATIO = 0.01;
/** この順位以内の指標を章の答えで「上位」として挙げる */
const TOP_RANK_TO_MENTION = 5;

interface SectionAnswerInput {
  /** 章に並ぶ指標 (表示順) */
  metrics: readonly MetricKpi[];
  /** rankingKey → 短ラベル */
  labels: Readonly<Record<string, string>>;
  /** ページの地域名 (県のページは県名、全国のページは "全国") */
  areaName: string;
  /** 県のページか (false = 全国のページ) */
  isPrefecture: boolean;
}

function valueText(metric: MetricKpi, value: number): string {
  const unit = metric.unit ? formatUnitForDisplay(metric.unit) : '';
  return `${formatMetricValue(value, metric.precision)}${unit}`;
}

function ratioText(ratio: number, more: string, less: string): string {
  const percent = Math.round(Math.abs(ratio) * 100);
  return `${percent}%${ratio > 0 ? more : less}`;
}

/**
 * 章の見出しの下に置く答えの文 (1〜2 文)。データだけから決まった手順で作り、モデルの書いた文を使わない (2026-11-03)。
 * 県のページ: 先頭の指標の値と全国との差 + 章の中で上位 5 位以内の指標。全国のページ: 最新の値と全国の系列の最初の年からの増減。
 * 言える材料が無ければ null (推測で埋めない)。
 */
export function buildSectionAnswer({ metrics, labels, areaName, isPrefecture }: SectionAnswerInput): string | null {
  const lead = metrics.find((metric) => metric.value !== null && !metric.isLoading);
  if (!lead || lead.value === null) return null;
  const label = labels[lead.metricKey] ?? lead.title;
  // 順位は県のページだけ。1 位が多い方か少ない方かは指標で違うので、向きの言葉を付けない
  const notes = [lead.yearName, isPrefecture && lead.rank !== null ? `全国${lead.rank}位` : null].filter(Boolean);
  const year = notes.length > 0 ? `（${notes.join('・')}）` : '';
  const sentences = [`${areaName}の${label}は${valueText(lead, lead.value)}${year}。`];

  if (isPrefecture) {
    if (lead.nationalValue !== undefined && lead.nationalValue !== 0) {
      const ratio = lead.value / lead.nationalValue - 1;
      sentences.push(
        Math.abs(ratio) < SAME_AS_NATIONAL_RATIO
          ? `全国（${valueText(lead, lead.nationalValue)}）とほぼ同じ。`
          : `全国（${valueText(lead, lead.nationalValue)}）より${ratioText(ratio, '多い', '少ない')}。`
      );
    }
    const top = metrics
      .filter((metric) => metric !== lead && metric.rank !== null && metric.rank <= TOP_RANK_TO_MENTION)
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      .slice(0, 2)
      .map((metric) => `${labels[metric.metricKey] ?? metric.title}（${metric.rank}位）`);
    if (top.length > 0) sentences.push(`この章で全国順位が上位なのは${top.join('・')}。`);
    return sentences.join('');
  }

  const series = lead.officialNationalSeries ?? [];
  const first = series[0];
  if (first && first.value !== 0 && series.length >= 2) {
    const ratio = lead.value / first.value - 1;
    sentences.push(
      Math.abs(ratio) < SAME_AS_NATIONAL_RATIO
        ? `${first.year}年（${valueText(lead, first.value)}）とほぼ同じ。`
        : `${first.year}年（${valueText(lead, first.value)}）から${ratioText(ratio, '増えた', '減った')}。`
    );
  }
  return sentences.join('');
}
