/** 2024年・20〜64歳の歩数。栄養摂取量とは対象年齢と調整年齢が異なる。 */
export const PHYSICAL_ACTIVITY_SOURCE = {
  r2Key: 'app/themes/sports-participation/physical-activity.json',
  period: '2024',
  unit: '歩/日',
  ageAdjustment: '20〜64歳・男女とも46歳に調整',
  url: 'https://www.mhlw.go.jp/content/001675215.pdf',
  sha256: 'ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1',
  title: '令和6年国民健康・栄養調査 第69表 歩数の平均値',
  metrics: [
    {
      key: 'daily-steps-male-20to64-age-adjusted',
      label: '歩数・男性',
      table: '第69表',
      pdfPage: 5,
      national: {
        mean: 8564,
        lower95: 8331,
        upper95: 8797,
        sampleSize: 3365,
      },
    },
    {
      key: 'daily-steps-female-20to64-age-adjusted',
      label: '歩数・女性',
      table: '第69表',
      pdfPage: 5,
      national: {
        mean: 7291,
        lower95: 7061,
        upper95: 7521,
        sampleSize: 4032,
      },
    },
  ],
  notes: [
    '2024年の20〜64歳の男女別歩数。男女とも46歳の平均年齢へ調整。20歳以上全体や公立小学5年生の値ではない。',
    '人数は第69表の歩数集計人数。全調査参加者数、栄養摂取量の集計人数、推計人口とは異なる。',
    '歩数計で測定した1日の歩数を用いる。年齢調整された推定平均なので、県平均の人数加重平均から全国値は作らず、公式全国行を用いる。',
    '標本調査の95%信頼区間と人数を併記し、順位差を有意差とみなさない。',
    '調査地区は473地区。通常1道府県10地区、東京都15地区、石川県8地区（能登半島地震の影響）。世帯主が外国人の世帯、3食集団給食の世帯、賄い付き寮等の単独世帯等は対象外。',
  ],
  sampleSizeDefinition:
    '第69表の20〜64歳・男女別の歩数集計人数。年齢調整前の当該指標集計に使われた標本人数で、人口推計値ではない。',
  methodologyUrl: 'https://www.mhlw.go.jp/content/001675210.pdf',
  methodologySha256:
    'f9062112308938b88e542656e872c0912ebe1e11750f583c1872d60f427c5643',
} as const;
