/** 公式原表の期間・分類・出典と地理対応を固定する。 */
export const AIRPORT_TRAFFIC_SOURCE = {
  r2Key: 'app/themes/tourism/airports.json',
  period: '2025',
  periodType: 'calendar',
  releaseStatus: 'final',
  title: '令和7年空港管理状況調書（国土交通省航空局）',
  url: 'https://www.mlit.go.jp/koku/15_bf_000185.html',
  files: [
    {
      filename: 'airport-2025.xlsx',
      url: 'https://www.mlit.go.jp/koku/content/002016480.xlsx',
      sha256:
        '0cd693d9b7dcc8b4c279608f6bb21468ededc8013a62754a3530b46bd34e988e',
    },
    {
      filename: 'airport-faq.pdf',
      url: 'https://www.mlit.go.jp/koku/content/002016455.pdf',
      sha256:
        '283274e6d9625a8fa43ddb2d700a8acf40caa18fa1d9223750a813332b514a7b',
    },
    {
      filename: 'airport-location-national.pdf',
      url: 'https://www.mlit.go.jp/koku/content/002021263.pdf',
      sha256:
        '428e2ef50f3d220f4a86af967847071f24046d500e150513554adc3818180720',
    },
    {
      filename: 'airport-location-special.pdf',
      url: 'https://www.mlit.go.jp/koku/content/002021264.pdf',
      sha256:
        'edbec8257f6b53c117ba54184fd72d5a80ac7b921399bec41649855d084bc599',
    },
    {
      filename: 'airport-location-local.pdf',
      url: 'https://www.mlit.go.jp/koku/content/002021265.pdf',
      sha256:
        '6501bb23f80db462e58d6fd515304d1a0dd8456433eab65ea219297913c2d47a',
    },
    {
      filename: 'airport-location-other.pdf',
      url: 'https://www.mlit.go.jp/koku/content/002021266.pdf',
      sha256:
        '9d8dcd4d0e2ccc694279a3c9bf48bfd77f974b749117154a9e72645c8351d1e6',
    },
    {
      filename: 'airport-location-shared.pdf',
      url: 'https://www.mlit.go.jp/koku/content/002021267.pdf',
      sha256:
        'd24f56825f6002e4c4eaf32353101d2ab0851feda71d7eccdf77544612f80a00',
    },
    {
      filename: 'airport-location-narita.pdf',
      url: 'https://www.mlit.go.jp/common/001066245.pdf',
      sha256:
        '0cfcb81e1b5c359d93e2b61c85ab4fbf5bb3dabc57a6e7a58b3be81162751a71',
    },
    {
      filename: 'airport-location-kansai.pdf',
      url: 'https://www.mlit.go.jp/common/001066246.pdf',
      sha256:
        'ce2e59a255e3501f1fb961e2892003017cea1c590234b458fd3685fa3b5f9b52',
    },
    {
      filename: 'airport-location-chubu.pdf',
      url: 'https://www.mlit.go.jp/common/001066247.pdf',
      sha256:
        'd6475301029626929c0a15d562da6a17a67410a841ddf18b532a30fa6fca19dd',
    },
    {
      filename: 'airport-location-itami.html',
      url: 'https://www.pa.kkr.mlit.go.jp/osakaport/sky/history/01.html',
      sha256:
        '8ab4a74fe6ff575884f92032c7dbd927677eb60fe3eb62947efd6f9a7621303e',
    },
  ],
  passengerUnit: '人',
  cargoUnit: 'トン',
  airportCount: 96,
  national: {
    passengers: {
      internationalBoarding: 56072100,
      internationalAlighting: 56483644,
      internationalTransit: 1832505,
      internationalTotal: 114388249,
      domesticBoarding: 114181843,
      domesticAlighting: 114187420,
      domesticTotal: 228369263,
      total: 342757512,
    },
    cargo: {
      internationalLoaded: 1754763,
      internationalUnloaded: 2001350,
      internationalTotal: 3756113,
      domesticLoaded: 600790,
      domesticUnloaded: 604406,
      domesticTotal: 1205196,
      total: 4961309,
    },
  },
  airports: [
    {
      airportName: '東京国際',
      areaCodes: ['13000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 1,
        locationText: '東京都大田区',
      },
    },
    {
      airportName: '新千歳',
      areaCodes: ['01000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 2,
        locationText: '北海道千歳市',
      },
    },
    {
      airportName: '稚内',
      areaCodes: ['01000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 3,
        locationText: '北海道稚内市',
      },
    },
    {
      airportName: '釧路',
      areaCodes: ['01000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 4,
        locationText: '北海道釧路市',
      },
    },
    {
      airportName: '函館',
      areaCodes: ['01000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 5,
        locationText: '北海道函館市',
      },
    },
    {
      airportName: '仙台',
      areaCodes: ['04000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 6,
        locationText: '宮城県名取市',
      },
    },
    {
      airportName: '新潟',
      areaCodes: ['15000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 7,
        locationText: '新潟県新潟市',
      },
    },
    {
      airportName: '広島',
      areaCodes: ['34000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 8,
        locationText: '広島県三原市',
      },
    },
    {
      airportName: '高松',
      areaCodes: ['37000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 9,
        locationText: '香川県高松市',
      },
    },
    {
      airportName: '松山',
      areaCodes: ['38000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 10,
        locationText: '愛媛県松山市',
      },
    },
    {
      airportName: '高知',
      areaCodes: ['39000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 11,
        locationText: '高知県南国市',
      },
    },
    {
      airportName: '福岡',
      areaCodes: ['40000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 12,
        locationText: '福岡県福岡市',
      },
    },
    {
      airportName: '北九州',
      areaCodes: ['40000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 13,
        locationText: '福岡県北九州市',
      },
    },
    {
      airportName: '長崎',
      areaCodes: ['42000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 14,
        locationText: '長崎県大村市',
      },
    },
    {
      airportName: '熊本',
      areaCodes: ['43000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 15,
        locationText: '熊本県菊池郡菊陽町',
      },
    },
    {
      airportName: '大分',
      areaCodes: ['44000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 16,
        locationText: '大分県国東市',
      },
    },
    {
      airportName: '宮崎',
      areaCodes: ['45000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 17,
        locationText: '宮崎県宮崎市',
      },
    },
    {
      airportName: '鹿児島',
      areaCodes: ['46000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 18,
        locationText: '鹿児島県霧島市',
      },
    },
    {
      airportName: '那覇',
      areaCodes: ['47000'],
      locationEvidence: {
        filename: 'airport-location-national.pdf',
        page: 19,
        locationText: '沖縄県那覇市',
      },
    },
    {
      airportName: '旭川',
      areaCodes: ['01000'],
      locationEvidence: {
        filename: 'airport-location-special.pdf',
        page: 1,
        locationText: '北海道上川郡東神楽町',
      },
    },
    {
      airportName: '帯広',
      areaCodes: ['01000'],
      locationEvidence: {
        filename: 'airport-location-special.pdf',
        page: 2,
        locationText: '北海道帯広市',
      },
    },
    {
      airportName: '秋田',
      areaCodes: ['05000'],
      locationEvidence: {
        filename: 'airport-location-special.pdf',
        page: 3,
        locationText: '秋田県秋田市',
      },
    },
    {
      airportName: '山形',
      areaCodes: ['06000'],
      locationEvidence: {
        filename: 'airport-location-special.pdf',
        page: 4,
        locationText: '山形県東根市',
      },
    },
    {
      airportName: '山口宇部',
      areaCodes: ['35000'],
      locationEvidence: {
        filename: 'airport-location-special.pdf',
        page: 5,
        locationText: '山口県宇部市',
      },
    },
    {
      airportName: '利尻',
      areaCodes: ['01000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 1,
        locationText: '北海道利尻郡利尻富士町',
      },
    },
    {
      airportName: '礼文',
      areaCodes: ['01000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 2,
        locationText: '北海道礼文郡礼文町',
      },
    },
    {
      airportName: '奥尻',
      areaCodes: ['01000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 3,
        locationText: '北海道奥尻郡奥尻町',
      },
    },
    {
      airportName: '中標津',
      areaCodes: ['01000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 4,
        locationText: '北海道標津郡中標津町',
      },
    },
    {
      airportName: '紋別',
      areaCodes: ['01000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 5,
        locationText: '北海道紋別市',
      },
    },
    {
      airportName: '女満別',
      areaCodes: ['01000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 6,
        locationText: '北海道網走郡大空町',
      },
    },
    {
      airportName: '青森',
      areaCodes: ['02000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 7,
        locationText: '青森県青森市',
      },
    },
    {
      airportName: '花巻',
      areaCodes: ['03000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 8,
        locationText: '岩手県花巻市',
      },
    },
    {
      airportName: '大館能代',
      areaCodes: ['05000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 9,
        locationText: '秋田県北秋田市',
      },
    },
    {
      airportName: '庄内',
      areaCodes: ['06000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 10,
        locationText: '山形県酒田市',
      },
    },
    {
      airportName: '福島',
      areaCodes: ['07000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 11,
        locationText: '福島県石川郡玉川村',
      },
    },
    {
      airportName: '大島',
      areaCodes: ['13000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 12,
        locationText: '東京都大島支庁管内大島町',
      },
    },
    {
      airportName: '新島',
      areaCodes: ['13000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 13,
        locationText: '東京都大島支庁管内新島村',
      },
    },
    {
      airportName: '神津島',
      areaCodes: ['13000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 14,
        locationText: '東京都大島支庁管内神津島村',
      },
    },
    {
      airportName: '三宅島',
      areaCodes: ['13000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 15,
        locationText: '東京都三宅支庁管内三宅村',
      },
    },
    {
      airportName: '八丈島',
      areaCodes: ['13000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 16,
        locationText: '東京都八丈支庁管内八丈町',
      },
    },
    {
      airportName: '佐渡',
      areaCodes: ['15000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 17,
        locationText: '新潟県佐渡市',
      },
    },
    {
      airportName: '富山',
      areaCodes: ['16000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 18,
        locationText: '富山県富山市',
      },
    },
    {
      airportName: '能登',
      areaCodes: ['17000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 19,
        locationText: '石川県鳳珠郡穴水町',
      },
    },
    {
      airportName: '福井',
      areaCodes: ['18000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 20,
        locationText: '福井県坂井市',
      },
    },
    {
      airportName: '松本',
      areaCodes: ['20000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 21,
        locationText: '長野県松本市',
      },
    },
    {
      airportName: '静岡',
      areaCodes: ['22000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 22,
        locationText: '静岡県牧之原市',
      },
    },
    {
      airportName: '神戸',
      areaCodes: ['28000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 23,
        locationText: '兵庫県神戸市',
      },
    },
    {
      airportName: '南紀白浜',
      areaCodes: ['30000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 24,
        locationText: '和歌山県西牟婁郡白浜町',
      },
    },
    {
      airportName: '鳥取',
      areaCodes: ['31000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 25,
        locationText: '鳥取県鳥取市',
      },
    },
    {
      airportName: '隠岐',
      areaCodes: ['32000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 26,
        locationText: '島根県隠岐郡隠岐の島町',
      },
    },
    {
      airportName: '出雲',
      areaCodes: ['32000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 27,
        locationText: '島根県簸川郡斐川町',
      },
    },
    {
      airportName: '石見',
      areaCodes: ['32000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 28,
        locationText: '島根県益田市',
      },
    },
    {
      airportName: '岡山',
      areaCodes: ['33000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 29,
        locationText: '岡山県岡山市',
      },
    },
    {
      airportName: '佐賀',
      areaCodes: ['41000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 30,
        locationText: '佐賀県佐賀市',
      },
    },
    {
      airportName: '対馬',
      areaCodes: ['42000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 31,
        locationText: '長崎県対馬市',
      },
    },
    {
      airportName: '小値賀',
      areaCodes: ['42000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 32,
        locationText: '長崎県北松浦郡小値賀町',
      },
    },
    {
      airportName: '福江',
      areaCodes: ['42000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 33,
        locationText: '長崎県五島市',
      },
    },
    {
      airportName: '上五島',
      areaCodes: ['42000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 34,
        locationText: '長崎県南松浦郡新上五島町',
      },
    },
    {
      airportName: '壱岐',
      areaCodes: ['42000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 35,
        locationText: '長崎県壱岐市',
      },
    },
    {
      airportName: '種子島',
      areaCodes: ['46000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 36,
        locationText: '鹿児島県熊毛郡中種子町',
      },
    },
    {
      airportName: '屋久島',
      areaCodes: ['46000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 37,
        locationText: '鹿児島県熊毛郡屋久島町',
      },
    },
    {
      airportName: '奄美',
      areaCodes: ['46000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 38,
        locationText: '鹿児島奄美市',
      },
    },
    {
      airportName: '喜界',
      areaCodes: ['46000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 39,
        locationText: '鹿児島県大島郡喜界町',
      },
    },
    {
      airportName: '徳之島',
      areaCodes: ['46000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 40,
        locationText: '鹿児島県大島郡天城町',
      },
    },
    {
      airportName: '沖永良部',
      areaCodes: ['46000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 41,
        locationText: '鹿児島県大島郡和泊町',
      },
    },
    {
      airportName: '与論',
      areaCodes: ['46000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 42,
        locationText: '鹿児島県大島郡与論町',
      },
    },
    {
      airportName: '粟国',
      areaCodes: ['47000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 43,
        locationText: '沖縄県島尻郡粟国村',
      },
    },
    {
      airportName: '久米島',
      areaCodes: ['47000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 44,
        locationText: '沖縄県島尻郡久米島町',
      },
    },
    {
      airportName: '慶良間',
      areaCodes: ['47000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 45,
        locationText: '沖縄県島尻郡座間味村',
      },
    },
    {
      airportName: '南大東',
      areaCodes: ['47000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 46,
        locationText: '沖縄県島尻郡南大東村',
      },
    },
    {
      airportName: '北大東',
      areaCodes: ['47000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 47,
        locationText: '沖縄県島尻郡北大東村',
      },
    },
    {
      airportName: '伊江島',
      areaCodes: ['47000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 48,
        locationText: '沖縄県国頭郡伊江村',
      },
    },
    {
      airportName: '宮古',
      areaCodes: ['47000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 49,
        locationText: '沖縄県宮古島市',
      },
    },
    {
      airportName: '下地島',
      areaCodes: ['47000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 50,
        locationText: '沖縄県宮古島市',
      },
    },
    {
      airportName: '多良間',
      areaCodes: ['47000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 51,
        locationText: '沖縄県宮古郡多良間村',
      },
    },
    {
      airportName: '石垣',
      areaCodes: ['47000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 52,
        locationText: '沖縄県石垣市',
      },
    },
    {
      airportName: '波照間',
      areaCodes: ['47000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 53,
        locationText: '沖縄県八重山郡竹富町',
      },
    },
    {
      airportName: '与那国',
      areaCodes: ['47000'],
      locationEvidence: {
        filename: 'airport-location-local.pdf',
        page: 54,
        locationText: '沖縄県八重山郡与那国町',
      },
    },
    {
      airportName: '調布',
      areaCodes: ['13000'],
      locationEvidence: {
        filename: 'airport-location-other.pdf',
        page: 1,
        locationText: '東京都調布市',
      },
    },
    {
      airportName: '名古屋',
      areaCodes: ['23000'],
      locationEvidence: {
        filename: 'airport-location-other.pdf',
        page: 2,
        locationText: '愛知県西春日井郡豊山町',
      },
    },
    {
      airportName: '但馬',
      areaCodes: ['28000'],
      locationEvidence: {
        filename: 'airport-location-other.pdf',
        page: 3,
        locationText: '兵庫県豊岡市',
      },
    },
    {
      airportName: '岡南',
      areaCodes: ['33000'],
      locationEvidence: {
        filename: 'airport-location-other.pdf',
        page: 4,
        locationText: '岡山県岡山市',
      },
    },
    {
      airportName: '天草',
      areaCodes: ['43000'],
      locationEvidence: {
        filename: 'airport-location-other.pdf',
        page: 5,
        locationText: '熊本県天草市',
      },
    },
    {
      airportName: '大分県央',
      areaCodes: ['44000'],
      locationEvidence: {
        filename: 'airport-location-other.pdf',
        page: 6,
        locationText: '大分県豊後大野市',
      },
    },
    {
      airportName: '八尾',
      areaCodes: ['27000'],
      locationEvidence: {
        filename: 'airport-location-other.pdf',
        page: 7,
        locationText: '大阪府八尾市',
      },
    },
    {
      airportName: '札幌',
      areaCodes: ['01000'],
      locationEvidence: {
        filename: 'airport-location-shared.pdf',
        page: 1,
        locationText: '北海道札幌市',
      },
    },
    {
      airportName: '三沢',
      areaCodes: ['02000'],
      locationEvidence: {
        filename: 'airport-location-shared.pdf',
        page: 2,
        locationText: '青森県三沢市',
      },
    },
    {
      airportName: '百里',
      areaCodes: ['08000'],
      locationEvidence: {
        filename: 'airport-location-shared.pdf',
        page: 3,
        locationText: '茨城県小美玉市',
      },
    },
    {
      airportName: '小松',
      areaCodes: ['17000'],
      locationEvidence: {
        filename: 'airport-location-shared.pdf',
        page: 4,
        locationText: '石川県小松市',
      },
    },
    {
      airportName: '美保',
      areaCodes: ['31000'],
      locationEvidence: {
        filename: 'airport-location-shared.pdf',
        page: 5,
        locationText: '鳥取県境港市',
      },
    },
    {
      airportName: '岩国',
      areaCodes: ['35000'],
      locationEvidence: {
        filename: 'airport-location-shared.pdf',
        page: 6,
        locationText: '山口県岩国市',
      },
    },
    {
      airportName: '徳島',
      areaCodes: ['36000'],
      locationEvidence: {
        filename: 'airport-location-shared.pdf',
        page: 7,
        locationText: '徳島県板野郡松茂町',
      },
    },
    {
      airportName: '成田国際',
      areaCodes: ['12000'],
      locationEvidence: {
        filename: 'airport-location-narita.pdf',
        page: 1,
        locationText: '千葉県成田市',
      },
    },
    {
      airportName: '中部国際',
      areaCodes: ['23000'],
      locationEvidence: {
        filename: 'airport-location-chubu.pdf',
        page: 1,
        locationText: '愛知県常滑市',
      },
    },
    {
      airportName: '関西国際',
      areaCodes: ['27000'],
      locationEvidence: {
        filename: 'airport-location-kansai.pdf',
        page: 1,
        locationText: '大阪府泉南郡田尻町',
      },
    },
    {
      airportName: '大阪国際',
      areaCodes: ['27000', '28000'],
      locationEvidence: {
        filename: 'airport-location-itami.html',
        page: null,
        locationText: '大阪府豊中市、大阪府池田市、兵庫県伊丹市',
      },
    },
  ],
  notes: [
    '2025年1〜12月の確定値。表に収録された96空港（共用飛行場・その他空港を含む）を対象とし、12ヘリポートを除く。',
    '旅客数は空港での乗客・降客・国際線通過客の延べ取扱い。同じ人の国内出発と到着は両空港で計上され、居住地別の利用者数や実人数ではない。',
    '国際線の通過客は国際線から国際線への乗り継ぎ旅客。国内線・国際線・通過客を区別する。座席を使用しない幼児も1人と数える。',
    '貨物は積込・取卸の取扱量（トン）で、国内線と国際線を区別する。貨物量から発地・最終消費地の経済規模を推定しない。郵便は別項目のため含めない。',
    '県選択は空港の所在地による。大阪国際空港は大阪府・兵庫県にまたがるため両県で同じ1空港を表示し、全国では1回だけ集計する。県表示の単純合算は行わない。',
    '全国は96空港の合計。原表の全空港計3からヘリポート計（旅客103人・貨物0トン）を除いて照合している。空港が掲載されない県は「対象空港なし」と表示し、県民の航空利用ゼロとはしない。',
    '所在地は公式空港概要資料の県を採用。会社管理3空港の所在地根拠資料は過年度版を含むが、観測値は2025年の原表に統一している。',
  ],
} as const;
