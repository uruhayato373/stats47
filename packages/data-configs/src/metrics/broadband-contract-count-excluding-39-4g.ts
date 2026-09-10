import type { MetricConfig } from '../types';

export const broadbandContractCountExcluding394g: MetricConfig = {
  key: 'broadband-contract-count-excluding-39-4g',
  title: 'ブロードバンドサービス契約数',
  subtitle: '3.9〜4世代携帯電話アクセスサービスを除く',
  description: 'FTTH、DSL、CATV、FWA、BWAアクセスサービスの契約数の合計。LTE等の3.9〜4世代携帯電話アクセスサービスを除きます。',
  note: '3月31日現在の契約数で、APIの年区分は年度です。BWAを含むため固定系回線だけの集計ではありません。契約数は世帯普及率や通信速度を示しません。携帯電話アクセスを含む旧H7703系列とは接続しません。',
  unit: '契約',
  category: 'ict',
  source: {
    kind: 'estat', statsDataId: '0000010108', cdCat01: 'H7704',
    displayName: '社会・人口統計体系（原典：電気通信サービスの契約数及びシェアに関する四半期データ）',
    url: 'https://www.e-stat.go.jp/koumoku/koumoku_teigi/H',
  },
  entities: ['prefecture'], years: 'all', yearFormat: 'fiscal',
  display: { conversionFactor: 1, decimalPlaces: 0 },
  isActive: true,
};
