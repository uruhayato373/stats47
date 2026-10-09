import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from '../../packages/data-configs/src/types';

export const heatstrokeDeaths: MetricConfig = {
  key: 'heatstroke-deaths',
  title: '熱中症による死亡数',
  subtitle: '人口動態統計（確定数）',
  description: '人口動態統計（確定数）で熱中症（死因の傷病名が熱及び光線の作用等に当たるもの）を原因として死亡した人数を、住所地の都道府県別に集計した実数。',
  note: '人口で割っていない実数のため、人口の多い県ほど大きくなりやすい。年ごとの猛暑の強さで大きく変動し、小さな県では1年の増減が順位を大きく動かす。表中の「-」は該当なし（0人）として扱った。平成29年（2017年）以前は、都道府県からの報告漏れ（2019年3月公表）による再集計を行ったため、当時の概況とは一致しない箇所がある。消防庁の熱中症救急搬送人員（5〜9月）とは集計対象と期間が異なる。',
  unit: '人',
  category: 'safetyenvironment',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '厚生労働省「熱中症による死亡数 人口動態統計（確定数）より」',
    url: 'https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/tokusyu/necchusho24/index.html',
    config: {
      source: {
        name: '厚生労働省「熱中症による死亡数 人口動態統計（確定数）より」',
        url: 'https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/tokusyu/necchusho24/index.html',
      },
      provenance: {
        url: 'https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/tokusyu/necchusho24/xls/R06necchusho.xlsx',
        sourceSha256: 'b59c31b00f45cb70d47bb2e83a761c6beb7b241dc57160524f6f618b35afefc4',
        publicationIndexUrl: 'https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/tokusyu/necchusho24/index.html',
        table: '都道府県別にみた熱中症による死亡数の年次推移（平成25年〜令和6年）シート「都道府県別」',
        valueColumn: '各年の「総数」列（男・女列は男＋女＝総数の検算にのみ使用）',
        dataYear: '2013〜2024年（確定数）',
        accessedAt: '2026-10-08',
        extraction:
          'SHA-256固定のxlsxをexceljsで読み、年見出し（2024〜2013）と「総数／男／女」の列構成を確認して47県の総数列を取得。「-」は0として扱う。同内容のPDF（dl/R06kenbetsu.pdf）の東京2024年424人などと目視照合済み。',
        verification:
          '12年すべてで、47県が欠測・重複なく揃う／県ごとに男＋女＝総数／全国＝男＋女／全国は47県合計以上で差は最大7人（住所地が外国・不詳の分）／全国値が同じxlsxの別シート「年齢別」の総数行と全年一致。',
        restore: 'node .claude/scripts/data/fetch-heatstroke-deaths-mhlw.mjs',
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2013,
    to: 2024,
  },
  yearFormat: 'calendar',
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
  },
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  surveyId: 'vital-statistics',
  isActive: true,
};
