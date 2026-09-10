/** Authored source definitions; observations are generated into canonical R2 artifacts. */
export const LANDSLIDE_EXPOSURE_SOURCE = {
  slug: 'population-landslide-exposure',
  dataVersion: 'A33-25_m250r6-24_PTN2020_P05-22_center-v1',
  r2Root: 'app/geo/population-landslide-exposure',
  populationScale: 10000,
  excludedAreaCodes: ['26000'],
  availableAreaCodes: [
    '01000',
    '02000',
    '03000',
    '04000',
    '05000',
    '06000',
    '07000',
    '08000',
    '09000',
    '10000',
    '11000',
    '12000',
    '13000',
    '14000',
    '15000',
    '16000',
    '17000',
    '18000',
    '19000',
    '20000',
    '21000',
    '22000',
    '23000',
    '24000',
    '25000',
    '27000',
    '28000',
    '29000',
    '30000',
    '31000',
    '32000',
    '33000',
    '34000',
    '35000',
    '36000',
    '37000',
    '38000',
    '39000',
    '40000',
    '41000',
    '42000',
    '43000',
    '44000',
    '45000',
    '46000',
    '47000',
  ],
  a33: {
    datasetId: 'A33',
    version: '25',
    title: '国土数値情報 土砂災害警戒区域（2025年度版）',
    pageUrl: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A33-2025.html',
    nominalDate: '2025-08-01',
    licenseKey: 'cc-by-4.0-partial',
    scopedPublication:
      '46 prefectures allowed with per-prefecture attribution; Kyoto excluded',
    indexSha256:
      '49c071012931652d949a878bb118625f42e7f2d9db7ce31277cf36e972684876',
    permissions: {
      url: 'https://nlftp.mlit.go.jp/ksj/gml/codelist/A33_permision_R7.xlsx',
      sha256:
        '5fb6cce7a63bb04c3b0e12d30aaa86106b7fd81b29468c86577f4179e550dc81',
    },
  },
  population: {
    datasetId: 'm250r6',
    version: '24',
    title: '国土数値情報 250mメッシュ別将来推計人口（R6推計）2020年基準人口',
    pageUrl:
      'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh250r6.html',
    field: 'PTN_2020',
  },
  facilities: {
    datasetId: 'P05',
    version: '22',
    title: '国土数値情報 市町村役場等・公的集会施設（2022年4月）',
    pageUrl: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P05-v3_0.html',
    archiveUrl:
      'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
    archiveSha256:
      '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    administrativeClasses: [1, 2, 3],
    meetingClasses: [4, 5],
  },
  prefectures: [
    {
      areaCode: '01000',
      areaName: '北海道',
      dataDate: '2025-08-01',
      id: 'landslide-01',
      version: '25',
      filename: 'A33-25_01_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_01_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・北海道の資料を加工',
      bytes: 5252048,
      sha256:
        '6544418c3028c6a7ca9d789a50dbebed683126c88d1932042a00de48b85b9e17',
      members: [
        {
          name: 'データ利用時の注意事項\\01_北海道_データ利用時の注意事項.txt',
          bytes: 1961,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_01.xml',
          bytes: 15452,
        },
        {
          name: 'A33-25_01Polygon.geojson',
          bytes: 23194145,
        },
      ],
    },
    {
      areaCode: '02000',
      areaName: '青森県',
      dataDate: 'R7.3末',
      id: 'landslide-02',
      version: '25',
      filename: 'A33-25_02_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_02_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・青森県の資料を加工',
      bytes: 2805650,
      sha256:
        '74e73e7ea5146e2707c12a8118bbfc727e17dd7795c1f190d6a2731a8358744a',
      members: [
        {
          name: 'データ利用時の注意事項\\02_青森県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_02.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_02Polygon.geojson',
          bytes: 11913215,
        },
      ],
    },
    {
      areaCode: '03000',
      areaName: '岩手県',
      dataDate: 'R7.3末',
      id: 'landslide-03',
      version: '25',
      filename: 'A33-25_03_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_03_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・岩手県の資料を加工',
      bytes: 10872759,
      sha256:
        'b8604c850243b08496b08581030bbe8846f28e1a984482df315550ee1e173155',
      members: [
        {
          name: 'データ利用時の注意事項\\03_岩手県_データ利用時の注意事項.txt',
          bytes: 2030,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_03.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_03Polygon.geojson',
          bytes: 46611791,
        },
      ],
    },
    {
      areaCode: '04000',
      areaName: '宮城県',
      dataDate: '2025-08-28',
      id: 'landslide-04',
      version: '25',
      filename: 'A33-25_04_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_04_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・この国土数値情報（土砂災害警戒区域データ）は宮城県砂防総合情報システム　MIDSKI（https://www.doshasaigai.pref.miyagi.jp/midski/）で公開されているデータを加工したものです。',
      bytes: 4837164,
      sha256:
        'e38eb257de887548ce7996b1f9b1f68eafd5e205cc2bcd85e05b3307dbcb43bd',
      members: [
        {
          name: 'データ利用時の注意事項\\04_宮城県_データ利用時の注意事項.txt',
          bytes: 2206,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_04.xml',
          bytes: 15453,
        },
        {
          name: 'A33-25_04Polygon.geojson',
          bytes: 28150795,
        },
      ],
    },
    {
      areaCode: '05000',
      areaName: '秋田県',
      dataDate: 'R7.3末',
      id: 'landslide-05',
      version: '25',
      filename: 'A33-25_05_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_05_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・秋田県の資料を加工',
      bytes: 5061731,
      sha256:
        '7b239bfc0023c3c3f9bd0b228317ddd24152ba95fbda21fd57dfef4d0d71085e',
      members: [
        {
          name: 'データ利用時の注意事項\\05_秋田県_データ利用時の注意事項.txt',
          bytes: 2030,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_05.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_05Polygon.geojson',
          bytes: 22016709,
        },
      ],
    },
    {
      areaCode: '06000',
      areaName: '山形県',
      dataDate: '2025-04-22',
      id: 'landslide-06',
      version: '25',
      filename: 'A33-25_06_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_06_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・この国土数値情報（土砂災害警戒区域データ）は山形県土砂災害警戒システム（https://sabo.pref.yamagata.jp/）で公開されているデータを加工したものです。',
      bytes: 4197066,
      sha256:
        'f3fc44b01698326486a65238b20eda76e6b7e6503aef3ce4c63bb89ca85aa131',
      members: [
        {
          name: 'データ利用時の注意事項\\06_山形県_データ利用時の注意事項.txt',
          bytes: 2114,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_06.xml',
          bytes: 15456,
        },
        {
          name: 'A33-25_06Polygon.geojson',
          bytes: 16873088,
        },
      ],
    },
    {
      areaCode: '07000',
      areaName: '福島県',
      dataDate: 'R7.3末',
      id: 'landslide-07',
      version: '25',
      filename: 'A33-25_07_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_07_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・この国土数値情報（土砂災害警戒区域データ）は土砂アラート（福島県土砂災最大情報システム）（https://d-keikai.pref.fukushima.lg.jp/）で公開されているデータを加工したものです。',
      bytes: 4249645,
      sha256:
        '26c96761458f2b9bd4c3dd99d5c0c262b57e6b94b7cc72b08711cded73b50807',
      members: [
        {
          name: 'データ利用時の注意事項\\07_福島県_データ利用時の注意事項.txt',
          bytes: 2206,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_07.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_07Polygon.geojson',
          bytes: 22302385,
        },
      ],
    },
    {
      areaCode: '08000',
      areaName: '茨城県',
      dataDate: 'R7.3末',
      id: 'landslide-08',
      version: '25',
      filename: 'A33-25_08_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_08_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・茨城県の資料を加工',
      bytes: 3038572,
      sha256:
        '77e1f85c4990b2509f4fe07e501bded793082027774b99e1448a3df3d77dff4f',
      members: [
        {
          name: 'データ利用時の注意事項\\08_茨城県_データ利用時の注意事項.txt',
          bytes: 2030,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_08.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_08Polygon.geojson',
          bytes: 13019197,
        },
      ],
    },
    {
      areaCode: '09000',
      areaName: '栃木県',
      dataDate: '2025-06-24',
      id: 'landslide-09',
      version: '25',
      filename: 'A33-25_09_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_09_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・栃木県の資料を加工',
      bytes: 5299207,
      sha256:
        '52717deaa4a7c850ee165d1aca03eb92fcabf78b9d17dcd58e8eced4e3dde485',
      members: [
        {
          name: 'データ利用時の注意事項\\09_栃木県_データ利用時の注意事項.txt',
          bytes: 2032,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_09.xml',
          bytes: 15453,
        },
        {
          name: 'A33-25_09Polygon.geojson',
          bytes: 25721225,
        },
      ],
    },
    {
      areaCode: '10000',
      areaName: '群馬県',
      dataDate: 'R6.3末',
      id: 'landslide-10',
      version: '25',
      filename: 'A33-25_10_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_10_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・群馬県の資料を加工',
      bytes: 6121076,
      sha256:
        '5bbb2fdd5f01346df810d3f95ca573988c3c406a5df70c49c946b31028b8fb42',
      members: [
        {
          name: 'データ利用時の注意事項\\10_群馬県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_10.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_10Polygon.geojson',
          bytes: 25946109,
        },
      ],
    },
    {
      areaCode: '11000',
      areaName: '埼玉県',
      dataDate: 'R7.3末',
      id: 'landslide-11',
      version: '25',
      filename: 'A33-25_11_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_11_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・埼玉県の資料を加工',
      bytes: 3102984,
      sha256:
        'd4fa80570299aed0d7567e9467a7b3e30aae8d13e22e31451ba6fa7783cc1e07',
      members: [
        {
          name: 'データ利用時の注意事項\\11_埼玉県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_11.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_11Polygon.geojson',
          bytes: 13484408,
        },
      ],
    },
    {
      areaCode: '12000',
      areaName: '千葉県',
      dataDate: '2025-08-20',
      id: 'landslide-12',
      version: '25',
      filename: 'A33-25_12_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_12_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・CC BY 4.0\n・この国土数値情報（土砂災害警戒区域データ）は以下の著作物を改変して利用しています。ちば情報マップ（土砂災害警戒区域（急傾斜地の崩壊）、土砂災害特別警戒区域（急傾斜地の崩壊）、土砂災害警戒区域（土石流）、土砂災害特別警戒区域（土石流）、土砂災害警戒区域（地すべり）、(指定予定)土砂災害警戒区域（急傾斜地の崩壊）、(指定予定)土砂災害特別警戒区域（急傾斜地の崩壊））、千葉県、国土数値情報、クリエイティブ・コモンズ・ライセンス 表示 4.0 国際（https://creativecommons.org/licenses/by/4.0/deed.ja）',
      bytes: 13004167,
      sha256:
        '12c7e0120b0b9ca4a19ad3ec4b2054ef21e55c0599cfbb1dd2ea1d7bfc509e8e',
      members: [
        {
          name: 'データ利用時の注意事項\\12_千葉県_データ利用時の注意事項.txt',
          bytes: 2465,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_12.xml',
          bytes: 15453,
        },
        {
          name: 'A33-25_12Polygon.geojson',
          bytes: 63181154,
        },
      ],
    },
    {
      areaCode: '13000',
      areaName: '東京都',
      dataDate: '2025-07-30',
      id: 'landslide-13',
      version: '25',
      filename: 'A33-25_13_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_13_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・東京都の資料を加工',
      bytes: 7011838,
      sha256:
        '4107d815b48fd3a4e9d5394ff4c8504f9f54924293bb021c5f51b6ea3f2ee847',
      members: [
        {
          name: 'データ利用時の注意事項\\13_東京都_データ利用時の注意事項.txt',
          bytes: 1962,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_13.xml',
          bytes: 15453,
        },
        {
          name: 'A33-25_13Polygon.geojson',
          bytes: 32969107,
        },
      ],
    },
    {
      areaCode: '14000',
      areaName: '神奈川県',
      dataDate: 'R7.6末',
      id: 'landslide-14',
      version: '25',
      filename: 'A33-25_14_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_14_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions:
        '・本データは、土砂災害防止法に基づく申請の際の根拠資料として利用できません。',
      attribution: '国土数値情報（土砂災害警戒区域）・神奈川県の資料を加工',
      bytes: 15065217,
      sha256:
        '654e7f967c43aebc89510a4ec1230e02e0bece4395c2e044609b0f3fafdeb726',
      members: [
        {
          name: 'データ利用時の注意事項\\14_神奈川県_データ利用時の注意事項.txt',
          bytes: 2038,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_14.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_14Polygon.geojson',
          bytes: 74774182,
        },
      ],
    },
    {
      areaCode: '15000',
      areaName: '新潟県',
      dataDate: 'R7.3末',
      id: 'landslide-15',
      version: '25',
      filename: 'A33-25_15_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_15_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・CC BY 4.0\n・この国土数値情報（土砂災害警戒区域データ）は以下の著作物を改変して利用しています。土砂災害(特別)警戒区域、新潟県、国土数値情報、クリエイティブ・コモンズ・ライセンス 表示 4.0国際（https://creativecommons.org/licenses/by/4.0/deed.ja）',
      bytes: 16006815,
      sha256:
        'e9aff389289efb4f3afa311f6ddffbb696ac27ad834b40761d837333d7c7d19b',
      members: [
        {
          name: 'データ利用時の注意事項\\15_新潟県_データ利用時の注意事項.txt',
          bytes: 2206,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_15.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_15Polygon.geojson',
          bytes: 69420106,
        },
      ],
    },
    {
      areaCode: '16000',
      areaName: '富山県',
      dataDate: 'R7.3末',
      id: 'landslide-16',
      version: '25',
      filename: 'A33-25_16_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_16_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・富山県の資料を加工',
      bytes: 6367169,
      sha256:
        '789a68d6c39fe041465979ee4d0619fef953e60e70670e0db29d40c35e0ac534',
      members: [
        {
          name: 'データ利用時の注意事項\\16_富山県_データ利用時の注意事項.txt',
          bytes: 2030,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_16.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_16Polygon.geojson',
          bytes: 28256907,
        },
      ],
    },
    {
      areaCode: '17000',
      areaName: '石川県',
      dataDate: '2025-05-16',
      id: 'landslide-17',
      version: '25',
      filename: 'A33-25_17_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_17_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・この国土数値情報（土砂災害警戒区域データ）は石川県土木部砂防課webページで公開されている石川県土砂災害（特別）警戒区域図オープンデータ（https://www.pref.ishikawa.lg.jp/sabou/2dosya-jittai/index.html）を加工したものです。',
      bytes: 4161398,
      sha256:
        '6fc87850f1e8cc6210fb4d1344318a444034e4ddc07cdabfb00f1e0fbc03d26a',
      members: [
        {
          name: 'データ利用時の注意事項\\17_石川県_データ利用時の注意事項.txt',
          bytes: 2185,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_17.xml',
          bytes: 15453,
        },
        {
          name: 'A33-25_17Polygon.geojson',
          bytes: 18013256,
        },
      ],
    },
    {
      areaCode: '18000',
      areaName: '福井県',
      dataDate: 'R7.3末',
      id: 'landslide-18',
      version: '25',
      filename: 'A33-25_18_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_18_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・CC BY 4.0\n・この国土数値情報（土砂災害警戒区域データ）は以下の著作物を改変して利用しています。福井県オープンデータライブラリ（土砂災害警戒区域指定地位置情報（(全市町）地すべりGISデータ、(全市町）土石流GISデータ、(全市町）急傾斜地の崩壊GISデータ）））、福井県、国土数値情報、クリエイティブ・コモンズ・ライセンス 表示 4.0 国際（https://creativecommons.org/licenses/by/4.0/deed.ja）',
      bytes: 6488888,
      sha256:
        '86d1852361c03767a871e8e0f53b589d8d4b2dc421099105b63d83f8d518dca4',
      members: [
        {
          name: 'データ利用時の注意事項\\18_福井県_データ利用時の注意事項.txt',
          bytes: 2411,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_18.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_18Polygon.geojson',
          bytes: 28877669,
        },
      ],
    },
    {
      areaCode: '19000',
      areaName: '山梨県',
      dataDate: 'R7.3末',
      id: 'landslide-19',
      version: '25',
      filename: 'A33-25_19_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_19_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・山梨県の資料を加工',
      bytes: 5602929,
      sha256:
        '1c05ac756bb194e21203d83a5e2ffdd4e874cbb197bf3b8d5d70f188c3986633',
      members: [
        {
          name: 'データ利用時の注意事項\\19_山梨県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_19.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_19Polygon.geojson',
          bytes: 22921594,
        },
      ],
    },
    {
      areaCode: '20000',
      areaName: '長野県',
      dataDate: 'R6.6末',
      id: 'landslide-20',
      version: '25',
      filename: 'A33-25_20_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_20_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・CC BY 4.0\n・この国土数値情報（土砂災害警戒区域データ）は以下の著作物を改変して利用しています。信州砂防情報マップ（土砂災害警戒区域（指定済み）土石流、土砂災害警戒区域（指定済み）急傾斜地の崩壊、土砂災害警戒区域（指定済み）地滑り、土砂災害特別警戒区域（指定済み）土石流、土砂災害特別警戒区域（指定済み）急傾斜地の崩壊、土砂災害特別警戒区域（指定済み）地滑り）、長野県、国土数値情報、クリエイティブ・コモンズ・ライセンス 表示 4.0国際（https://creativecommons.org/licenses/by/4.0/deed.ja）',
      bytes: 13937691,
      sha256:
        '28c14719ac6e7ae1dabe021d07f854f2d7cb9925e3dc2d319ca16237c6f06e55',
      members: [
        {
          name: 'データ利用時の注意事項\\20_長野県_データ利用時の注意事項.txt',
          bytes: 2448,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_20.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_20Polygon.geojson',
          bytes: 70534683,
        },
      ],
    },
    {
      areaCode: '21000',
      areaName: '岐阜県',
      dataDate: 'R7.7末',
      id: 'landslide-21',
      version: '25',
      filename: 'A33-25_21_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_21_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・岐阜県の資料を加工',
      bytes: 16045271,
      sha256:
        '57115afa0f44c5d8eeeb53de7540c7e8f8831cb59c81b22f396738117b5c8c36',
      members: [
        {
          name: 'データ利用時の注意事項\\21_岐阜県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_21.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_21Polygon.geojson',
          bytes: 66624624,
        },
      ],
    },
    {
      areaCode: '22000',
      areaName: '静岡県',
      dataDate: 'R6.8末（急傾斜地の崩壊、地すべり）\nR6.12.6（土石流）',
      id: 'landslide-22',
      version: '25',
      filename: 'A33-25_22_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_22_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・この国土数値情報（土砂災害警戒区域データ）は静岡県地理情報システム　静岡県GIS（https://www.gis.pref.shizuoka.jp/）で公開されているデータを加工したものです。',
      bytes: 14153595,
      sha256:
        'd3ff97227d81900135d9b3c59d5e58037398e3fb5bdda9a462731eaf70a68221',
      members: [
        {
          name: 'データ利用時の注意事項\\22_静岡県_データ利用時の注意事項.txt',
          bytes: 2219,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_22.xml',
          bytes: 15491,
        },
        {
          name: 'A33-25_22Polygon.geojson',
          bytes: 63048106,
        },
      ],
    },
    {
      areaCode: '23000',
      areaName: '愛知県',
      dataDate: '2025-08-01',
      id: 'landslide-23',
      version: '25',
      filename: 'A33-25_23_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_23_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・CC BY 2.1 JP\n・この国土数値情報（土砂災害警戒区域データ）は、以下の著作物を改変して利用しています。愛知県オープンデータカタログ（マップあいち公開データ）（土砂災害情報マップ）、愛知県、国土数値情報、クリエイティブ・コモンズ・ライセンス表示２.１日本（http://creativecommons.org/licenses/by/2.1/jp/）',
      bytes: 9820674,
      sha256:
        'f4c2bf008e8c66e49a96141946294a75e85fdb73cb596804cc26305ef188617f',
      members: [
        {
          name: 'データ利用時の注意事項\\23_愛知県_データ利用時の注意事項.txt',
          bytes: 2331,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_23.xml',
          bytes: 15452,
        },
        {
          name: 'A33-25_23Polygon.geojson',
          bytes: 44608023,
        },
      ],
    },
    {
      areaCode: '24000',
      areaName: '三重県',
      dataDate: 'R7.3末',
      id: 'landslide-24',
      version: '25',
      filename: 'A33-25_24_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_24_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・三重県の資料を加工',
      bytes: 12304049,
      sha256:
        '33a29a9c1d80cab2efd33268a6c1a3e4ddbddb8484043a3395b5b5a3b40f9cfc',
      members: [
        {
          name: 'データ利用時の注意事項\\24_三重県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_24.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_24Polygon.geojson',
          bytes: 54126575,
        },
      ],
    },
    {
      areaCode: '25000',
      areaName: '滋賀県',
      dataDate: 'R7.3末',
      id: 'landslide-25',
      version: '25',
      filename: 'A33-25_25_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_25_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・この国土数値情報（土砂災害警戒区域データ）は滋賀県防災情報マップ（https://shiga-bousai.jp/dmap/gis_download/index）で公開されているデータを加工したものです。',
      bytes: 2756450,
      sha256:
        'aa1648b9d35f15671856d126e22dcbfe49bd508df71140c4b40cd27505fb4729',
      members: [
        {
          name: 'データ利用時の注意事項\\25_滋賀県_データ利用時の注意事項.txt',
          bytes: 2121,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_25.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_25Polygon.geojson',
          bytes: 12953332,
        },
      ],
    },
    {
      areaCode: '26000',
      areaName: '京都府',
      dataDate: 'R7.2末',
      id: 'landslide-26',
      version: '25',
      filename: 'A33-25_26_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_26_GEOJSON.zip',
      publication: 'excluded-commercial-restriction',
      conditions: '・データの二次利用における制限（商用利用不可）。',
      attribution: '国土数値情報（土砂災害警戒区域）・京都府の資料を加工',
    },
    {
      areaCode: '27000',
      areaName: '大阪府',
      dataDate: '2025-08-27',
      id: 'landslide-27',
      version: '25',
      filename: 'A33-25_27_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_27_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・大阪府の資料を加工',
      bytes: 3972062,
      sha256:
        '8122136c170cd35429823b4412ca815e8cd12a65965e875ff749ffa663355cce',
      members: [
        {
          name: 'データ利用時の注意事項\\27_大阪府_データ利用時の注意事項.txt',
          bytes: 1962,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_27.xml',
          bytes: 15453,
        },
        {
          name: 'A33-25_27Polygon.geojson',
          bytes: 18072874,
        },
      ],
    },
    {
      areaCode: '28000',
      areaName: '兵庫県',
      dataDate: 'R7.3末',
      id: 'landslide-28',
      version: '25',
      filename: 'A33-25_28_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_28_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・兵庫県の資料を加工',
      bytes: 11821469,
      sha256:
        '3136e781c4350f4a325838671c6796a1d9385da47108a92287ba755b2ff1a652',
      members: [
        {
          name: 'データ利用時の注意事項\\28_兵庫県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_28.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_28Polygon.geojson',
          bytes: 51643554,
        },
      ],
    },
    {
      areaCode: '29000',
      areaName: '奈良県',
      dataDate: 'R7.7末',
      id: 'landslide-29',
      version: '25',
      filename: 'A33-25_29_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_29_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・奈良県の資料を加工',
      bytes: 7487046,
      sha256:
        '5e824e69ec56a10e6d91c57f09f8e467cf2e6226a8279e19d6a2a4f2515d5a38',
      members: [
        {
          name: 'データ利用時の注意事項\\29_奈良県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_29.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_29Polygon.geojson',
          bytes: 35374502,
        },
      ],
    },
    {
      areaCode: '30000',
      areaName: '和歌山県',
      dataDate: 'R7.6末',
      id: 'landslide-30',
      version: '25',
      filename: 'A33-25_30_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_30_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions:
        '・データを申請その他の資料として用いることはできません。\n・原典資料提供元の和歌山県が有しているデータを加工したものです。',
      attribution: '国土数値情報（土砂災害警戒区域）・和歌山県の資料を加工',
      bytes: 15108930,
      sha256:
        'da38bc467ea5bc1be5fecc6ad5de07a37aefb6109c81a378566c6ff5fb27ad62',
      members: [
        {
          name: 'データ利用時の注意事項\\30_和歌山県_データ利用時の注意事項.txt',
          bytes: 2081,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_30.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_30Polygon.geojson',
          bytes: 67068558,
        },
      ],
    },
    {
      areaCode: '31000',
      areaName: '鳥取県',
      dataDate: '2025-01-01',
      id: 'landslide-31',
      version: '25',
      filename: 'A33-25_31_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_31_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions:
        '・本ページで提供する土砂災害警戒区域等の位置は、概略位置を示した参考図であり土砂災害警戒区域等の境界を明示するものではありません。より正確な情報が必要な場合は、必ず所管機関へお問い合わせください。',
      attribution:
        '・CC BY 2.1 JP\n・この国土数値情報（土砂災害警戒区域データ）は、以下の著作物を改変して利用しています。鳥取県オープンデータポータルサイト（土砂災害警戒区域等データ）、鳥取県、国土数値情報、クリエイティブ・コモンズ・ライセンス表示２.１日本（http://creativecommons.org/licenses/by/2.1/jp/）',
      bytes: 4779640,
      sha256:
        '7d80f2ac352cccf8feb6e7302e056856d78e179f098ebfac9796f6280e1ea515',
      members: [
        {
          name: 'データ利用時の注意事項\\31_鳥取県_データ利用時の注意事項.txt',
          bytes: 2446,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_31.xml',
          bytes: 15452,
        },
        {
          name: 'A33-25_31Polygon.geojson',
          bytes: 20675185,
        },
      ],
    },
    {
      areaCode: '32000',
      areaName: '島根県',
      dataDate: 'R7.3末',
      id: 'landslide-32',
      version: '25',
      filename: 'A33-25_32_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_32_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・島根県の資料を加工',
      bytes: 16903947,
      sha256:
        '058c0390ec69416433aacfa8633ceda70e81c770c8904cd436ab5c3002add834',
      members: [
        {
          name: 'データ利用時の注意事項\\32_島根県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_32.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_32Polygon.geojson',
          bytes: 86070216,
        },
      ],
    },
    {
      areaCode: '33000',
      areaName: '岡山県',
      dataDate: 'R7.3末',
      id: 'landslide-33',
      version: '25',
      filename: 'A33-25_33_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_33_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・岡山県の資料を加工',
      bytes: 8789172,
      sha256:
        '39e6686ab71612490dca7c30ee82ef96307ccce3535bc3ebbddb5fe2dfefdcd8',
      members: [
        {
          name: 'データ利用時の注意事項\\33_岡山県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_33.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_33Polygon.geojson',
          bytes: 38762205,
        },
      ],
    },
    {
      areaCode: '34000',
      areaName: '広島県',
      dataDate: '2025-07-24',
      id: 'landslide-34',
      version: '25',
      filename: 'A33-25_34_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_34_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions:
        '・警戒区域等の地図は、概略位置を示した参考図であり警戒区域等の境界を明示するものではありません。また、土砂災害防止法に関する情報の全てを掲載しているものではありません。正確な情報が必要な場合は、広島県の地方機関である建設事務所（支所）へお問い合わせください。',
      attribution:
        '・CC BY\n・この国土数値情報（土砂災害警戒区域データ）は、土砂災害ポータルひろしま（https://www.sabo.pref.hiroshima.lg.jp/portal/agreeGISAll.aspx）および広島県Dobox（https://hiroshima-dobox.jp/index2）で公開されているデータを加工したものです。',
      bytes: 27824117,
      sha256:
        '0569ae9426b96615adf57004946bf85f4c59d337671f97681e3c711d6018a25f',
      members: [
        {
          name: 'データ利用時の注意事項\\34_広島県_データ利用時の注意事項.txt',
          bytes: 2463,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_34.xml',
          bytes: 15453,
        },
        {
          name: 'A33-25_34Line.geojson',
          bytes: 1085805,
        },
        {
          name: 'A33-25_34Polygon.geojson',
          bytes: 136167141,
        },
      ],
    },
    {
      areaCode: '35000',
      areaName: '山口県',
      dataDate: '2025-08-01',
      id: 'landslide-35',
      version: '25',
      filename: 'A33-25_35_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_35_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・山口県の資料を加工',
      bytes: 19155847,
      sha256:
        '4dc4fbd42a1ed65b303c4e97d96310346bdcfd1906be3dc100d04d0af8cb4b9c',
      members: [
        {
          name: 'データ利用時の注意事項\\35_山口県_データ利用時の注意事項.txt',
          bytes: 2031,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_35.xml',
          bytes: 15452,
        },
        {
          name: 'A33-25_35Polygon.geojson',
          bytes: 88440466,
        },
      ],
    },
    {
      areaCode: '36000',
      areaName: '徳島県',
      dataDate: 'R7.3末',
      id: 'landslide-36',
      version: '25',
      filename: 'A33-25_36_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_36_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・徳島県の資料を加工',
      bytes: 10154907,
      sha256:
        'f1a597ffefb47e81282e5ddbc08feb7df70543cb28e221c61dcffc06ec099643',
      members: [
        {
          name: 'データ利用時の注意事項\\36_徳島県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_36.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_36Polygon.geojson',
          bytes: 46544053,
        },
      ],
    },
    {
      areaCode: '37000',
      areaName: '香川県',
      dataDate: 'R6.6末',
      id: 'landslide-37',
      version: '25',
      filename: 'A33-25_37_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_37_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・香川県の資料を加工',
      bytes: 4343375,
      sha256:
        'd01993079fdd4179248f4e35a74cc56663274a2613e4aff0204fff11e2259ccd',
      members: [
        {
          name: 'データ利用時の注意事項\\37_香川県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_37.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_37Polygon.geojson',
          bytes: 19097029,
        },
      ],
    },
    {
      areaCode: '38000',
      areaName: '愛媛県',
      dataDate: 'R7.3末',
      id: 'landslide-38',
      version: '25',
      filename: 'A33-25_38_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_38_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・愛媛県の資料を加工',
      bytes: 13550543,
      sha256:
        '6eee86d36c295f5bcfc697f67fe76a4cea3dfca9e51ef02a6c47d167137dbcd8',
      members: [
        {
          name: 'データ利用時の注意事項\\38_愛媛県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_38.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_38Polygon.geojson',
          bytes: 57894554,
        },
      ],
    },
    {
      areaCode: '39000',
      areaName: '高知県',
      dataDate: 'R7.8',
      id: 'landslide-39',
      version: '25',
      filename: 'A33-25_39_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_39_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・この国土数値情報（土砂災害警戒区域データ）は高知県の土砂災害危険度情報（https://d-keikai.pref.kochi.lg.jp/index.aspx）で公開されているデータを加工したものです。',
      bytes: 19733588,
      sha256:
        '567b83d3a9f6b2e7e385ada142ab2229f075f35fbd7d82f0fdce36bb3056b1b5',
      members: [
        {
          name: 'データ利用時の注意事項\\39_高知県_データ利用時の注意事項.txt',
          bytes: 2122,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_39.xml',
          bytes: 15448,
        },
        {
          name: 'A33-25_39Polygon.geojson',
          bytes: 88440923,
        },
      ],
    },
    {
      areaCode: '40000',
      areaName: '福岡県',
      dataDate: '2025-04-21',
      id: 'landslide-40',
      version: '25',
      filename: 'A33-25_40_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_40_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・CC BY 2.1 JP\n・この国土数値情報（土砂災害警戒区域データ）は、以下の著作物を改変して利用しています。福岡県オープンデータカタログサイト（福岡県　土砂災害警戒区域等のShapeデータ）、福岡県、国土数値情報、クリエイティブ・コモンズ・ライセンス表示２.１日本（http://creativecommons.org/licenses/by/2.1/jp/）',
      bytes: 11395493,
      sha256:
        '78d3056e89e07f834bebf5c81eb4824c7530f6710f74805bed7237ca1e59d8cb',
      members: [
        {
          name: 'データ利用時の注意事項\\40_福岡県_データ利用時の注意事項.txt',
          bytes: 2264,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_40.xml',
          bytes: 15453,
        },
        {
          name: 'A33-25_40Polygon.geojson',
          bytes: 49337409,
        },
      ],
    },
    {
      areaCode: '41000',
      areaName: '佐賀県',
      dataDate: '2025-05-20',
      id: 'landslide-41',
      version: '25',
      filename: 'A33-25_41_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_41_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・佐賀県の資料を加工',
      bytes: 7984844,
      sha256:
        '2f1e8b2e78f9524edb1341c284df447b4028954bd21a494a47f51d48a9b725af',
      members: [
        {
          name: 'データ利用時の注意事項\\41_佐賀県_データ利用時の注意事項.txt',
          bytes: 2030,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_41.xml',
          bytes: 15453,
        },
        {
          name: 'A33-25_41Polygon.geojson',
          bytes: 36305021,
        },
      ],
    },
    {
      areaCode: '42000',
      areaName: '長崎県',
      dataDate: '2025-08-01',
      id: 'landslide-42',
      version: '25',
      filename: 'A33-25_42_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_42_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '・出典元を記入してください。',
      attribution:
        '・CC BY 4.0\n・この国土数値情報（土砂災害警戒区域データ）は、長崎県オープンデータカタログサイトの土砂災害警戒区域等（https://data.bodik.jp/dataset/420000_doshasaigaikeikaikuiki）のデータを加工したものです。長崎県、国土数値情報、クリエイティブ・コモンズ・ライセンス 表示 4.0 国際（https://creativecommons.org/licenses/by/4.0/deed.ja）',
      bytes: 19410179,
      sha256:
        '50aba0accbc310dc5cb60c07b9eb6c6506661ac8ea3d7e361b590fe4dc00e92a',
      members: [
        {
          name: 'データ利用時の注意事項\\42_長崎県_データ利用時の注意事項.txt',
          bytes: 2323,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_42.xml',
          bytes: 15452,
        },
        {
          name: 'A33-25_42Polygon.geojson',
          bytes: 90546975,
        },
      ],
    },
    {
      areaCode: '43000',
      areaName: '熊本県',
      dataDate: '2024-12-17',
      id: 'landslide-43',
      version: '25',
      filename: 'A33-25_43_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_43_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・熊本県の資料を加工',
      bytes: 16710019,
      sha256:
        '7a6f100075825fcc1363ba01c8a05bbbbb37ce716930b7c6d322d821e3b76830',
      members: [
        {
          name: 'データ利用時の注意事項\\43_熊本県_データ利用時の注意事項.txt',
          bytes: 1963,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_43.xml',
          bytes: 15454,
        },
        {
          name: 'A33-25_43Polygon.geojson',
          bytes: 73448966,
        },
      ],
    },
    {
      areaCode: '44000',
      areaName: '大分県',
      dataDate: 'R7.3末',
      id: 'landslide-44',
      version: '25',
      filename: 'A33-25_44_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_44_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・大分県の資料を加工',
      bytes: 12974795,
      sha256:
        'feb8f46d3239e956385ca055e7d6284331f3e1c17623fd014ec7f9be1829997e',
      members: [
        {
          name: 'データ利用時の注意事項\\44_大分県_データ利用時の注意事項.txt',
          bytes: 1960,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_44.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_44Polygon.geojson',
          bytes: 59365831,
        },
      ],
    },
    {
      areaCode: '45000',
      areaName: '宮崎県',
      dataDate: 'R7.3末',
      id: 'landslide-45',
      version: '25',
      filename: 'A33-25_45_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_45_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・宮崎県の資料を加工',
      bytes: 9599337,
      sha256:
        '73e40f53045df9fddcfbf1e8c073df24d134b3834187318a0024fb83d91904a6',
      members: [
        {
          name: 'データ利用時の注意事項\\45_宮崎県_データ利用時の注意事項.txt',
          bytes: 2030,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_45.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_45Polygon.geojson',
          bytes: 42071312,
        },
      ],
    },
    {
      areaCode: '46000',
      areaName: '鹿児島県',
      dataDate: '2025-07-07',
      id: 'landslide-46',
      version: '25',
      filename: 'A33-25_46_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_46_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution:
        '・CC BY 4.0\n・この国土数値情報（土砂災害警戒区域データ）は、鹿児島県オープンデータカタログサイトの鹿児島県土砂災害警戒区域データ等（https://data.bodik.jp/dataset/460001_kgod016）のデータを加工したものです。鹿児島県、国土数値情報、クリエイティブ・コモンズ・ライセンス 表示 4.0 国際（https://creativecommons.org/licenses/by/4.0/deed.ja）',
      bytes: 24643179,
      sha256:
        'b96418cb29bed310072032492769685d07b5d42b066f779d0e4ebd59d2d2c899',
      members: [
        {
          name: 'データ利用時の注意事項\\46_鹿児島県_データ利用時の注意事項.txt',
          bytes: 2296,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_46.xml',
          bytes: 15452,
        },
        {
          name: 'A33-25_46Polygon.geojson',
          bytes: 111160467,
        },
      ],
    },
    {
      areaCode: '47000',
      areaName: '沖縄県',
      dataDate: 'R7.7末',
      id: 'landslide-47',
      version: '25',
      filename: 'A33-25_47_GEOJSON.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_47_GEOJSON.zip',
      publication: 'allowed-with-attribution',
      conditions: '',
      attribution: '国土数値情報（土砂災害警戒区域）・沖縄県の資料を加工',
      bytes: 1048860,
      sha256:
        'f608cbb39231cbe85ef36dab1a2ee5f5300c965d2e3c4714b220b3e0e03189b1',
      members: [
        {
          name: 'データ利用時の注意事項\\47_沖縄県_データ利用時の注意事項.txt',
          bytes: 2046,
        },
        {
          name: 'メタデータ\\KS-META-A33-25_47.xml',
          bytes: 15451,
        },
        {
          name: 'A33-25_47Polygon.geojson',
          bytes: 4472466,
        },
      ],
    },
  ],
  populationSources: [
    {
      areaCode: '01000',
      areaName: '北海道',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_01_SHP.zip',
      version: '24',
      bytes: 39461665,
      sha256:
        '9b54d8a4821bb91f642908af1143ac2b626e84bd937af9a3992be5c3d2e946ee',
      populatedRecords: 74073,
      zeroRecords: 0,
      populationScaled: 52246140117,
    },
    {
      areaCode: '02000',
      areaName: '青森県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_02_SHP.zip',
      version: '24',
      bytes: 13201718,
      sha256:
        '1ca9f933aa31c014148c792ff36f2a9dc7d05671ab9833e40c772744b50eb6c0',
      populatedRecords: 19579,
      zeroRecords: 0,
      populationScaled: 12379840068,
    },
    {
      areaCode: '03000',
      areaName: '岩手県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_03_SHP.zip',
      version: '24',
      bytes: 20285723,
      sha256:
        '6d897540dfe0c341d1bf7db422fd1965be065265429a35a5d3510545f6f61af0',
      populatedRecords: 38298,
      zeroRecords: 0,
      populationScaled: 12105340025,
    },
    {
      areaCode: '04000',
      areaName: '宮城県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_04_SHP.zip',
      version: '24',
      bytes: 19915373,
      sha256:
        'c752ad70f643d8fa16bc8bcc2b5f54fef7028d2d3e69ca3ece37501594e7d285',
      populatedRecords: 31283,
      zeroRecords: 0,
      populationScaled: 23019960055,
    },
    {
      areaCode: '05000',
      areaName: '秋田県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_05_SHP.zip',
      version: '24',
      bytes: 13148078,
      sha256:
        '24858b16e383ae988c98c08dd68bae8c4648e7352437c2325dce7e7d2f10ba91',
      populatedRecords: 21632,
      zeroRecords: 0,
      populationScaled: 9595020026,
    },
    {
      areaCode: '06000',
      areaName: '山形県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_06_SHP.zip',
      version: '24',
      bytes: 12383953,
      sha256:
        '2b7a751cc3901292b65cea7f678d4ca61339a09bbf5c20f817b0bdc5f0ee4eca',
      populatedRecords: 18264,
      zeroRecords: 0,
      populationScaled: 10680270003,
    },
    {
      areaCode: '07000',
      areaName: '福島県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_07_SHP.zip',
      version: '24',
      bytes: 24186647,
      sha256:
        'd2c6ea67a7ef1eeb411fae338f32731e6908405fa87f5b942fcef9c393c1090e',
      populatedRecords: 41299,
      zeroRecords: 0,
      populationScaled: 18331520072,
    },
    {
      areaCode: '08000',
      areaName: '茨城県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_08_SHP.zip',
      version: '24',
      bytes: 33353372,
      sha256:
        '4bf8103cfa4a2feed99ce69aa69959bc23440abf162fd369b2673830beeae57d',
      populatedRecords: 46897,
      zeroRecords: 0,
      populationScaled: 28670089880,
    },
    {
      areaCode: '09000',
      areaName: '栃木県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_09_SHP.zip',
      version: '24',
      bytes: 23031993,
      sha256:
        '7b550ae4818f96154eefc07d8d9244e185583b6e881a6fb277a0941ec8b0a9fd',
      populatedRecords: 34921,
      zeroRecords: 0,
      populationScaled: 19331459982,
    },
    {
      areaCode: '10000',
      areaName: '群馬県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_10_SHP.zip',
      version: '24',
      bytes: 18706592,
      sha256:
        '2dd92074db459650654aba37fbe0e6fc75710c1ae4e4b59f3924d0416e1e585b',
      populatedRecords: 25078,
      zeroRecords: 0,
      populationScaled: 19391099937,
    },
    {
      areaCode: '11000',
      areaName: '埼玉県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_11_SHP.zip',
      version: '24',
      bytes: 29602194,
      sha256:
        '3952b5c62c9a6534676c09a29cb88e2dbdea48a2d5dfcf2c5f84e66bd497d614',
      populatedRecords: 33827,
      zeroRecords: 0,
      populationScaled: 73447649991,
    },
    {
      areaCode: '12000',
      areaName: '千葉県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_12_SHP.zip',
      version: '24',
      bytes: 33058979,
      sha256:
        'd6ab429091435c8d98a2f74d8f3c5bafad06c10c5fcff04497e7e4dc4e4570ed',
      populatedRecords: 44082,
      zeroRecords: 0,
      populationScaled: 62844800088,
    },
    {
      areaCode: '13000',
      areaName: '東京都',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_13_SHP.zip',
      version: '24',
      bytes: 19638063,
      sha256:
        'ce5f07f1e1164a1ef7e3803a527f78712a9f63f0a61e31bb87e2ff6185711d3d',
      populatedRecords: 18728,
      zeroRecords: 0,
      populationScaled: 140475939969,
    },
    {
      areaCode: '14000',
      areaName: '神奈川県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_14_SHP.zip',
      version: '24',
      bytes: 20804106,
      sha256:
        'a74b68266a6d48c1bb83f08bd8affd2d77125d552af31c3dd62073d0964bb413',
      populatedRecords: 20880,
      zeroRecords: 0,
      populationScaled: 92373369958,
    },
    {
      areaCode: '15000',
      areaName: '新潟県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_15_SHP.zip',
      version: '24',
      bytes: 21796659,
      sha256:
        '1ba30f77602ef9de82d0eb969f9a44caf539db89b0bfb8c0c909f67b446ddcb6',
      populatedRecords: 31061,
      zeroRecords: 0,
      populationScaled: 22012719866,
    },
    {
      areaCode: '16000',
      areaName: '富山県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_16_SHP.zip',
      version: '24',
      bytes: 11434478,
      sha256:
        '91f07b687d56602472496d235e21decf7289b27ca0a0881807a77fa9d5936daa',
      populatedRecords: 15773,
      zeroRecords: 0,
      populationScaled: 10348140022,
    },
    {
      areaCode: '17000',
      areaName: '石川県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_17_SHP.zip',
      version: '24',
      bytes: 9056406,
      sha256:
        'ccf6535a2f764674121fc6548b422cb11eef4ef6a83008060a94b446e1bdd2db',
      populatedRecords: 13142,
      zeroRecords: 0,
      populationScaled: 11325260013,
    },
    {
      areaCode: '18000',
      areaName: '福井県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_18_SHP.zip',
      version: '24',
      bytes: 7870472,
      sha256:
        '7d82301fe42963b5494dc259aa05e057a0f3814bda23448f5f204c686b6678a5',
      populatedRecords: 10449,
      zeroRecords: 0,
      populationScaled: 7668629973,
    },
    {
      areaCode: '19000',
      areaName: '山梨県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_19_SHP.zip',
      version: '24',
      bytes: 8476343,
      sha256:
        'af07498c3f9febddae04e835436c33f2eba95fe9eb2d32bf908d6f79d18268bd',
      populatedRecords: 11936,
      zeroRecords: 0,
      populationScaled: 8099739977,
    },
    {
      areaCode: '20000',
      areaName: '長野県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_20_SHP.zip',
      version: '24',
      bytes: 24248206,
      sha256:
        'faaab380a807e27321396f9b38b9389d389d1772088b68c8013cca94213ea576',
      populatedRecords: 35117,
      zeroRecords: 0,
      populationScaled: 20480109953,
    },
    {
      areaCode: '21000',
      areaName: '岐阜県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_21_SHP.zip',
      version: '24',
      bytes: 19561392,
      sha256:
        'e1bd81ecbd59a2c238624bdd01730adbfcfed17f377eaafc2b294719534beab1',
      populatedRecords: 27394,
      zeroRecords: 0,
      populationScaled: 19787419957,
    },
    {
      areaCode: '22000',
      areaName: '静岡県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_22_SHP.zip',
      version: '24',
      bytes: 25130569,
      sha256:
        'e8d67e2e8bfd7f8c82b13f9d0af4a412794a6f74c085a03fdedd2e373910c9c5',
      populatedRecords: 32128,
      zeroRecords: 0,
      populationScaled: 36332020064,
    },
    {
      areaCode: '23000',
      areaName: '愛知県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_23_SHP.zip',
      version: '24',
      bytes: 32830460,
      sha256:
        'cea13fb8d05398ee3c145ad92ab910432124cbc87c919e328d3d0832fb8c9d3c',
      populatedRecords: 37368,
      zeroRecords: 0,
      populationScaled: 75424149974,
    },
    {
      areaCode: '24000',
      areaName: '三重県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_24_SHP.zip',
      version: '24',
      bytes: 15721960,
      sha256:
        'cc31560a4f145aaf1095ea70c0c0cd8f0962b6fedb45d57b8f2f7361723758c1',
      populatedRecords: 21376,
      zeroRecords: 0,
      populationScaled: 17702540028,
    },
    {
      areaCode: '25000',
      areaName: '滋賀県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_25_SHP.zip',
      version: '24',
      bytes: 10194307,
      sha256:
        '8e008c12351cf03303fc2c851ad0e5056cce0501e0a7705860e24d16f5609315',
      populatedRecords: 12724,
      zeroRecords: 0,
      populationScaled: 14136099937,
    },
    {
      areaCode: '26000',
      areaName: '京都府',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_26_SHP.zip',
      version: '24',
      bytes: 10985353,
      sha256:
        '12060fa6517042c5de07813f9752f6421b7fdc6933f9642859f6d31ec79fe6bc',
      populatedRecords: 15174,
      zeroRecords: 0,
      populationScaled: 25780870074,
    },
    {
      areaCode: '27000',
      areaName: '大阪府',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_27_SHP.zip',
      version: '24',
      bytes: 17229764,
      sha256:
        '1b4848f83c4cd55bd6043d4c9cd234f063a1d77d3589fc8072b0612bde81bb68',
      populatedRecords: 17155,
      zeroRecords: 0,
      populationScaled: 88376849908,
    },
    {
      areaCode: '28000',
      areaName: '兵庫県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_28_SHP.zip',
      version: '24',
      bytes: 26992139,
      sha256:
        '9c5fdc20bc7fa9a5c7c1b0742f3ac2db303a6e8a53d247a5848808aa440dc794',
      populatedRecords: 36192,
      zeroRecords: 0,
      populationScaled: 54650019997,
    },
    {
      areaCode: '29000',
      areaName: '奈良県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_29_SHP.zip',
      version: '24',
      bytes: 8080326,
      sha256:
        '23b4413347cb8758e8502e1f19de651e51a408c8834b212edacc678d275d498d',
      populatedRecords: 11352,
      zeroRecords: 0,
      populationScaled: 13244729976,
    },
    {
      areaCode: '30000',
      areaName: '和歌山県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_30_SHP.zip',
      version: '24',
      bytes: 8680323,
      sha256:
        '054fa17db739bc5429f30915707f7116be6e788ff09630fb47104b9f893d741b',
      populatedRecords: 13042,
      zeroRecords: 0,
      populationScaled: 9225839961,
    },
    {
      areaCode: '31000',
      areaName: '鳥取県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_31_SHP.zip',
      version: '24',
      bytes: 6032967,
      sha256:
        'da080013f0dc68cff03d3dfee0278ece74f09e76525ea47fb7f5dfc8152695f5',
      populatedRecords: 8910,
      zeroRecords: 0,
      populationScaled: 5534070054,
    },
    {
      areaCode: '32000',
      areaName: '島根県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_32_SHP.zip',
      version: '24',
      bytes: 10873784,
      sha256:
        'aa3bda245a1a2fe27090f291acef3d8c6dade5fd94b6de34e5b2e46531df2f13',
      populatedRecords: 20665,
      zeroRecords: 0,
      populationScaled: 6711260047,
    },
    {
      areaCode: '33000',
      areaName: '岡山県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_33_SHP.zip',
      version: '24',
      bytes: 19179028,
      sha256:
        'fe7e0954eb9ddd3e20031aebab7bae1ab2b2ca144183c6b56dd32ec4432a4c1a',
      populatedRecords: 30239,
      zeroRecords: 0,
      populationScaled: 18884320030,
    },
    {
      areaCode: '34000',
      areaName: '広島県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_34_SHP.zip',
      version: '24',
      bytes: 20129429,
      sha256:
        '3f0c1b623f1f97a323e507ed92329657c71ae9d12c03a6cfe78ac05afe6dfdde',
      populatedRecords: 33157,
      zeroRecords: 0,
      populationScaled: 27997019942,
    },
    {
      areaCode: '35000',
      areaName: '山口県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_35_SHP.zip',
      version: '24',
      bytes: 13270760,
      sha256:
        '49f072ea4733b76b16e90ebda3da5bc5d6f844548e95e9eedb68b839959c51e6',
      populatedRecords: 22443,
      zeroRecords: 0,
      populationScaled: 13420589919,
    },
    {
      areaCode: '36000',
      areaName: '徳島県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_36_SHP.zip',
      version: '24',
      bytes: 8151120,
      sha256:
        '72133a2f368fd236ff19cefa1710fd13df6095dceddcc0bd857112e7f5b8c2ac',
      populatedRecords: 13364,
      zeroRecords: 0,
      populationScaled: 7195589989,
    },
    {
      areaCode: '37000',
      areaName: '香川県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_37_SHP.zip',
      version: '24',
      bytes: 9800058,
      sha256:
        'c91331bf500b8041c1addb5ab16d30e3e8f8dc3daeb95655449c1b4ebcadd428',
      populatedRecords: 13401,
      zeroRecords: 0,
      populationScaled: 9502440041,
    },
    {
      areaCode: '38000',
      areaName: '愛媛県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_38_SHP.zip',
      version: '24',
      bytes: 11637179,
      sha256:
        'b811da7523fc7fef5ca8fbd00991fac33f56b3e018cd59ac3932f22aa13a40f8',
      populatedRecords: 18405,
      zeroRecords: 0,
      populationScaled: 13348409982,
    },
    {
      areaCode: '39000',
      areaName: '高知県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_39_SHP.zip',
      version: '24',
      bytes: 7854939,
      sha256:
        '1e6c9e5ad406be34d50d4c49de3573d29094554229dbd43bc7dfa2d69578dba0',
      populatedRecords: 14596,
      zeroRecords: 0,
      populationScaled: 6915269859,
    },
    {
      areaCode: '40000',
      areaName: '福岡県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_40_SHP.zip',
      version: '24',
      bytes: 26326160,
      sha256:
        '1e1e977e8a9f3ee68f056c6adaaa30a6540437940577f43b696bb64e74c2d57c',
      populatedRecords: 32511,
      zeroRecords: 0,
      populationScaled: 51352140009,
    },
    {
      areaCode: '41000',
      areaName: '佐賀県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_41_SHP.zip',
      version: '24',
      bytes: 9447566,
      sha256:
        '5aa179db546d03b14981625061c19f73fc93955b3c6bb4185f73f7e7ee2a9f1c',
      populatedRecords: 13313,
      zeroRecords: 0,
      populationScaled: 8114419993,
    },
    {
      areaCode: '42000',
      areaName: '長崎県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_42_SHP.zip',
      version: '24',
      bytes: 13294019,
      sha256:
        '0ec683e3f76af2c79338e97cb7a2b93f643bd32b9d4a319bf117e2fab30c8636',
      populatedRecords: 21073,
      zeroRecords: 0,
      populationScaled: 13123169978,
    },
    {
      areaCode: '43000',
      areaName: '熊本県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_43_SHP.zip',
      version: '24',
      bytes: 17779463,
      sha256:
        '323bc078b08668df294923b0970b597779b1f6b75d4b69b098696b026281b8e6',
      populatedRecords: 27618,
      zeroRecords: 0,
      populationScaled: 17383010002,
    },
    {
      areaCode: '44000',
      areaName: '大分県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_44_SHP.zip',
      version: '24',
      bytes: 12283578,
      sha256:
        'a7fb298834cf5e6b40faa1a8e5bf8244d15e96c2e155420df416313b37a65397',
      populatedRecords: 21675,
      zeroRecords: 0,
      populationScaled: 11238520064,
    },
    {
      areaCode: '45000',
      areaName: '宮崎県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_45_SHP.zip',
      version: '24',
      bytes: 12016853,
      sha256:
        '328c42a2c6614263ad1446f72234436a383e317af397b318bf831240f33cc7a1',
      populatedRecords: 19775,
      zeroRecords: 0,
      populationScaled: 10695760058,
    },
    {
      areaCode: '46000',
      areaName: '鹿児島県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_46_SHP.zip',
      version: '24',
      bytes: 19112070,
      sha256:
        '129c521691f18efbed5da557f45213ca242d3ca2c610d060e954c4284d7a495b',
      populatedRecords: 33444,
      zeroRecords: 0,
      populationScaled: 15882560000,
    },
    {
      areaCode: '47000',
      areaName: '沖縄県',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_47_SHP.zip',
      version: '24',
      bytes: 6954183,
      sha256:
        '1defa5f22289368d53488c6d236a6b01f0bf6447ed5b100ac30e36d9e81c866c',
      populatedRecords: 8682,
      zeroRecords: 0,
      populationScaled: 14674799970,
    },
  ],
  notes: [
    '公開対象は京都府を除く46県。京都府のA33-25は商用利用不可のため曝露値を算出・配信しない。全国の値は「対象46県計」であり全国全域の推計ではない。',
    'A33-25の指定済み警戒区域・特別警戒区域（区域コード1・2）の面だけを使用。指定前（3・4）を混ぜず、広島県の指定済み特別警戒の線データ3016件も面包含計算から除外する。',
    '人口はm250r6-24の2020年基準人口。250mメッシュ中心の包含で全メッシュ人口を配分する近似であり、区域内に住む実人数や実被災者数ではない。面積按分は行わない。',
    '区域は2025年度版だが各県の整備時点は異なる。施設は2022年4月時点。現在または将来の区域・人口・施設を表すものではない。',
    '警戒・特別警戒と3現象の重複は6bitの和集合で一度だけ計上。特別警戒を警戒の内数と仮定せず、特別が警戒面外にある件数・人口も検査する。現象別人口は重なり、合算できない。',
    '施設はP05-22の市町村役場等（分類1〜3）と公的集会施設（4〜5）。同位置でも異なる原典行は別施設として保持。学校・病院や全建物の曝露を示すものではない。',
    '全国46県の区域を照合し、人口は原典SHICODE、施設は原典所在地コードへ帰属する。京都府付近では同府の区域を計算に使わないため対象46県側の結果にも区域入力不足の可能性がある。',
    '下側感度は単一の区域・現象の県別和集合に格子全体が含まれる人口、上側感度は利用可能な面と格子が交差する人口。下側は保守的で、実居住者の位置が不明なため信頼区間ではない。',
    '中心が区域面外という分類は安全や未指定を証明しない。KSJは全指定区域を網羅せず、指定・解除の反映に遅れがあり、特別警戒未指定フラグを残す。',
    '地図表示の簡略化は計算後のみ。人口・施設の照合は原典精度の面を使用。重複面の和集合と無効ポリゴンの修復方法・件数は県別出典の証拠へ記録する。',
    'KSJは縮尺1/25,000〜1/50,000相当の概略位置を示す。区域境界の確定、土砂災害防止法の申請、重要事項説明や根拠資料には使用できない。詳細は各県所管課の最新資料を確認。',
  ],
} as const;
