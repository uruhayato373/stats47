/** Source identity and the official survey geography (figure 1-5, rightmost column). */
export const DEPOPULATED_SETTLEMENTS_SOURCE = {
  r2Key: 'app/themes/aging-society/depopulated-settlements.json',
  period: '2024-04-01',
  unit: '集落',
  geography: 'national-and-ten-survey-blocks',
  universeId: 'inhabited-settlements-in-survey-designated-areas',
  title: '令和6年度 過疎地域等における集落の状況に関する現況把握調査 図表2-93',
  url: 'https://www.mlit.go.jp/kokudoseisaku/content/001903318.pdf',
  sha256: '577a570f6bca52f6458a59e3929e91269ae0ffa78bf88434851d1d87ae6b2e5c',
  bytes: 10647905,
  publicationIndexUrl:
    'https://www.mlit.go.jp/kokudoseisaku/kokudokeikaku_tk3_000010.html',
  releasedAt: '2025-08-08',
  accessedAt: '2026-09-10',
  table: '図表2-93 集落人口に占める65歳以上人口割合別 集落数【全体】',
  pdfPage: 81,
  printedPage: '2-61',
  mappingTable: '図表1-5 本調査で用いた地方ブロック',
  mappingPdfPage: 19,
  mappingPrintedPage: '1-6',
  universe:
    '過疎地域・振興山村・離島・半島・特別豪雪地帯など、調査対象区域に居住者がいる集落。1,085市町村の78,485集落で、全国の全集落や過疎地域だけの集落数ではない。',
  reference:
    '2024年4月1日の住民基本台帳人口等に基づく市町村回答。調査実施は2024年10〜12月。',
  denominator:
    '無回答を含む各地域の調査対象集落数。住民人数の割合ではなく、集落数の構成割合。',
  categories: [
    {
      key: 'age65Share0',
      label: '0%',
    },
    {
      key: 'age65Share1to19',
      label: '1〜19%',
    },
    {
      key: 'age65Share20to39',
      label: '20〜39%',
    },
    {
      key: 'age65Share40to49',
      label: '40〜49%',
    },
    {
      key: 'age65Share50to69',
      label: '50〜69%',
    },
    {
      key: 'age65Share70plus',
      label: '70%以上',
    },
    {
      key: 'unknownAgeShare',
      label: '無回答',
    },
  ],
  blocks: [
    {
      blockCode: '01',
      blockName: '北海道',
      prefectureCodes: ['01000'],
    },
    {
      blockCode: '02',
      blockName: '東北圏',
      prefectureCodes: [
        '02000',
        '03000',
        '04000',
        '05000',
        '06000',
        '07000',
        '15000',
      ],
    },
    {
      blockCode: '03',
      blockName: '首都圏',
      prefectureCodes: [
        '08000',
        '09000',
        '10000',
        '11000',
        '12000',
        '13000',
        '14000',
        '19000',
      ],
    },
    {
      blockCode: '04',
      blockName: '北陸圏',
      prefectureCodes: ['16000', '17000', '18000'],
    },
    {
      blockCode: '05',
      blockName: '中部圏',
      prefectureCodes: ['20000', '21000', '22000', '23000', '24000'],
    },
    {
      blockCode: '06',
      blockName: '近畿圏',
      prefectureCodes: ['25000', '26000', '27000', '28000', '29000', '30000'],
    },
    {
      blockCode: '07',
      blockName: '中国圏',
      prefectureCodes: ['31000', '32000', '33000', '34000', '35000'],
    },
    {
      blockCode: '08',
      blockName: '四国圏',
      prefectureCodes: ['36000', '37000', '38000', '39000'],
    },
    {
      blockCode: '09',
      blockName: '九州圏',
      prefectureCodes: [
        '40000',
        '41000',
        '42000',
        '43000',
        '44000',
        '45000',
        '46000',
      ],
    },
    {
      blockCode: '10',
      blockName: '沖縄県',
      prefectureCodes: ['47000'],
    },
  ],
  nationalPins: {
    age65Share0: 1044,
    age65Share1to19: 1493,
    age65Share20to39: 19735,
    age65Share40to49: 23310,
    age65Share50to69: 24594,
    age65Share70plus: 6921,
    unknownAgeShare: 1388,
    total: 78485,
    age65ShareUnder50: 45582,
    age65Share50plus: 31515,
    age65Share100: 1458,
  },
  notes: [
    '全国47都道府県を個別に比較する表ではない。北海道・沖縄県は1道県で構成するブロックで、他の45県の内訳は本表に公表されていない。県選択時は図表1-5に対応する地方ブロックの値を示し、県へ配分しない。',
    '65歳以上が50%以上の集落と100%の集落は再掲。100%は70%以上の内数で、7区分へ加算しない。',
    '無回答は高齢者がいない集落とは異なる。構成割合の分母から除外しない。',
    '原発事故に伴い過去の調査時点で避難指示区域にあった5町村は調査対象外。前回と対象区域が異なるため、単純な時系列変化として扱わない。',
  ],
  extraction:
    'SHA照合後、pdftotext -layoutでPDF81頁の図表2-93から10地方ブロック×11列と全国行を抽出。図表2-94と前回調査は除外。地方ブロック対応はPDF19頁の図表1-5右端列を画像照合。',
  verification:
    '7排他区分=総数、4区分=50%未満、2区分=50%以上、100%は70%以上の内数。11列で10ブロック計と全国を照合。全国78,485/無回答1,388/50%以上31,515/100%1,458を固定。',
  restore:
    'node --import tsx .claude/scripts/themes/ingest-depopulated-settlements.mjs --source-dir /tmp/stats47-depopulated-settlements-source --output-dir /tmp/stats47-depopulated-settlements-output --download',
} as const;
