/** 公式原表の期間・分類・出典と地理対応を固定する。 */
export const FREIGHT_OD_SOURCE = {
  r2Key: 'app/themes/freight-logistics/freight-od.json',
  period: '2024',
  title:
    '令和6年度貨物地域流動調査 府県相互間輸送トン数表（総貨物）・航空貨物付録',
  url: 'https://www.mlit.go.jp/k-toukei/kamoturyokakutiikiryuudoutyousa.html',
  files: [
    {
      filename: 'freight-od.xlsx',
      url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442551&fileKind=4',
      sha256:
        '1351405ccdf225e818c2fd14321323f3da976443f9eb9cd31eb018e69fce984b',
    },
    {
      filename: 'freight-air.xlsx',
      url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442553&fileKind=4',
      sha256:
        '3f4d5261b0c6c8c4d0001c34ff47867b9a1434992f6a33b260dda8f6a8321233',
    },
    {
      filename: 'freight-national.xlsx',
      url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442550&fileKind=4',
      sha256:
        '2679cd4c2b6df230393141399a99c3aa7d15a45fa58223e52b54db7faa84181f',
    },
    {
      filename: 'freight-summary.pdf',
      url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442549&fileKind=2',
      sha256:
        '2c22c411d96823ac3856a3a6f3b20478f95c73404cb56832fe0f3be37b57a39c',
    },
  ],
  modes: [
    {
      mode: 'rail',
      label: '鉄道',
      unit: 'トン',
      periodType: 'fiscal',
      officialNationalTotal: 26922653,
      nationalRoundingDifference: 0,
    },
    {
      mode: 'sea',
      label: '海運',
      unit: 'フレートトン',
      periodType: 'calendar',
      officialNationalTotal: 461930231,
      nationalRoundingDifference: 0,
    },
    {
      mode: 'road',
      label: '自動車',
      unit: 'トン',
      periodType: 'fiscal',
      officialNationalTotal: 3724797000,
      nationalRoundingDifference: -4,
    },
    {
      mode: 'air',
      label: '航空',
      unit: 'kg',
      periodType: 'fiscal',
      officialNationalTotal: 618117087,
      nationalRoundingDifference: 0,
    },
  ],
  notes: [
    '各輸送機関の国内輸送区間を表す。通過した県の交通量や、荷物の最初の生産地・最終消費地を示す純流動ではない。',
    '鉄道はJR貨物のみ。自動車は営業用・自家用の貨物自動車（霊きゅう車・自家用軽自動車を除く）で、標本を全国輸送量に合わせて地域へ配分した推計。県間の小さな差の解釈に注意。',
    '海運は港湾統計の2024暦年・フレートトン。鉄道・自動車の2024年度トン、航空の2024年度kgとは単位・期間が異なり、機関をまたいだ合計や構成比を作らない。',
    '海運では海上を仕出地とする貨物、フェリーの自動車と積荷を除く。自動車にはフェリー上の積荷を含む。海上出入貨物の一部は港湾所在県内の流動として計上される。',
    '北海道は公式の道内7地域をまとめた北海道行・列を採用し、7地域を重ねて足さない。同一県内の輸送を対角セルに残す。',
    '自動車の公表県別OD合計は全国公表値より4トン少ない。丸め差を補正せず保持し、相手県の構成比にはOD合計を分母とする。',
  ],
} as const;
