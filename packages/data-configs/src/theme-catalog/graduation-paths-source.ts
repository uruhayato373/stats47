export const GRADUATION_PATHS_SOURCE = {
  r2Key: 'app/themes/education-culture/graduation-paths.json',
  period: '2025-03',
  surveyYear: 2025,
  unit: '人',
  title:
    '令和7年度学校基本調査 表283 状況別卒業者数（高等学校・全日制/定時制）',
  url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040393936&fileKind=0',
  sha256: 'e754c347a2498b09ed65a174af40f4e73ead5663743edc5b3a58d5663df80c70',
  releaseStatus: 'final',
  releasedAt: '2025-12-26',
  geography: '卒業した学校の所在地の都道府県（居住地・進学先・就職先ではない）',
  universe:
    '2025年3月卒業の国公私立高等学校（全日制・定時制）。通信制高校・中等教育学校・特別支援学校は含めない。',
  denominator: '同じ表の卒業者総数。不詳・死亡を含めた8区分は排他的。',
  categories: [
    {
      key: 'university',
      label: '大学等進学',
      columns: [4],
    },
    {
      key: 'specialized',
      label: '専修学校専門課程',
      columns: [6],
    },
    {
      key: 'general',
      label: '専修学校一般課程等',
      columns: [7],
    },
    {
      key: 'vocational',
      label: '公共職業能力開発施設等',
      columns: [8],
    },
    {
      key: 'employment',
      label: '就職者等（臨時労働者を除く）',
      columns: [9, 10, 11],
    },
    {
      key: 'temporary',
      label: '臨時労働者',
      columns: [12],
    },
    {
      key: 'other',
      label: '左記以外の者',
      columns: [13],
    },
    {
      key: 'unknown',
      label: '不詳・死亡',
      columns: [14],
    },
  ],
  notes: [
    '大学等進学者は大学・短期大学の通信教育部への進学者も含む。通信制高校の卒業者はこの表の対象外。',
    '進学しながら就職している者は進学区分に1回だけ含め、再掲112人は構成へ加算しない。',
    '就職者等は進学A〜Dを除く。臨時労働者は契約期間1か月未満、有期雇用労働者は1か月以上。',
    '「左記以外の者」は外国の大学等への入学者・家事手伝い等も含むので、失業者数や進学希望断念者数とは呼ばない。',
    'この排他的な就職者等の割合は、再掲就職者を含む公式「卒業者に占める就職者の割合」と定義が異なる。既存2023年就職率とは合算しない。',
  ],
} as const;
