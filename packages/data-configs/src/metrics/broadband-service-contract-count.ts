import type { MetricConfig } from '../types';

export const broadbandServiceContractCount: MetricConfig = {
  key: 'broadband-service-contract-count',
  title: 'ブロードバンドサービス契約数',
  subtitle: '3.9〜4世代携帯電話アクセスを含む旧系列',
  description: 'FTTH、DSL、CATV、FWA、BWAと3.9〜4世代携帯電話アクセスサービスの契約数の合計。',
  note: '収集中止の歴史系列（2010〜2017年度）。現在の通信環境を示す値ではありません。携帯電話アクセスを除くH7704とは集計範囲が異なるため一本の時系列に接続しません。',
  unit: '契約',
  category: 'ict',
  source: {
    kind: 'estat', statsDataId: '0000010108', cdCat01: 'H7703',
    displayName: '社会・人口統計体系（原典：電気通信サービスの契約数及びシェアに関する四半期データ）',
    url: 'https://www.e-stat.go.jp/koumoku/koumoku_teigi/H',
  },
  entities: ['prefecture'], years: { from: 2010, to: 2017 }, yearFormat: 'fiscal',
  display: { conversionFactor: 1, decimalPlaces: 0 },
  isActive: true,
};
