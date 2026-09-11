/** 工場立地動向調査の設備投資。秘匿県を含むため、順位ではなく原表の状態を示す。 */
export const FACTORY_INVESTMENT_SOURCE = {
  r2Key: 'app/themes/manufacturing/factory-investment.json',
  period: '2024',
  unit: '百万円',
  title: '2024年工場立地動向調査 第14表 設備投資額（都道府県別）',
  url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040281965&fileKind=0',
  sha256: '8efee5987545c812125415122dc1471547e5089f8ccc33cf5b331f68b407c572',
  national: 1079437.62,
  suppressedCodes: ['39000', '41000', '47000'],
  notes: [
    '2024年1〜12月に工場建設のため1,000㎡以上の用地を取得（借地を含む）した事業者の設備投資額。工場立地に伴う計画を表し、県内の全企業による年間の投資実績ではありません。',
    '製造業、電気業（水力・地熱・太陽光発電所を除く）、ガス業、熱供給業を対象とする表です。研究所は含みません。設備投資額には用地取得費を含みます。',
    '原表のXは秘匿による非公表です。ゼロへの置換、全国値からの逆算、県順位の付与は行いません。公開されている県の合計を全国値とみなしません。',
    '全国は第13表の全業種合計とも一致する公式集計です。回答の得られた設備投資額の集計であり、立地件数すべてに金額の回答があるとは限りません。',
    '金額は百万円単位で原表の小数値を保持しています。取得できた2024年確報を掲載しており、2025年公表分とは区別しています。',
  ],
  definitionUrl:
    'https://www.meti.go.jp/statistics/toppage/topics/jisshinaiyou/chosakeikakufiles/01_kojyoricchi.pdf',
  plannedValueDefinitionUrl:
    'https://www.meti.go.jp/statistics/tii/ritti/result-2/pdf/r02sokuhou.pdf',
} as const;
