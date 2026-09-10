/** GSI public snapshot contract. Counts are source-cohort validation pins. */
export const SHELTER_APPLICABILITY_SOURCE = {
  seriesKey: 'shelter-applicability',
  dataVersion: 'gsi-hinanmap_2026-09-11_v1',
  acquiredOn: '2026-09-11',
  latestDatabaseUpdate: '2026-09-04',
  r2Key: 'app/themes/safety/shelter-applicability.json',
  title: '指定緊急避難場所・指定避難所データ',
  provider: '国土地理院・内閣府・消防庁（自治体登録の公開データ）',
  url: 'https://hinanmap.gsi.go.jp/hinanjocp/hinanbasho/koukaidate.html',
  definitionUrl: 'https://www.gsi.go.jp/bousaichiri/hinanbasho.html',
  confirmationUrl: 'https://www.gsi.go.jp/bousaichiri/hinanbasho.html',
  license:
    '公共データ利用規約 第1.0版（PDL1.0）＋避難場所等データの利用上の注意',
  licenseUrl: 'https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html',
  notesUrl: 'https://www.gsi.go.jp/bousaichiri/hinanbasho-menseki.html',
  hazards: [
    {
      key: 'flood',
      label: '洪水',
    },
    {
      key: 'landslide',
      label: '崖崩れ、土石流及び地滑り',
    },
    {
      key: 'storm-surge',
      label: '高潮',
    },
    {
      key: 'earthquake',
      label: '地震',
    },
    {
      key: 'tsunami',
      label: '津波',
    },
    {
      key: 'large-fire',
      label: '大規模な火事',
    },
    {
      key: 'inland-flood',
      label: '内水氾濫',
    },
    {
      key: 'volcanic',
      label: '火山現象',
    },
  ],
  expected: {
    emergencyFacilities: 115878,
    shelterFacilities: 83294,
    generalShelters: 72738,
    welfareShelters: 10556,
    catalogMunicipalities: 1747,
    bothPublished: 1691,
    emergencyOnlyPublished: 8,
    shelterOnlyPublished: 27,
    notPublished: 21,
    hazardApplicable: {
      flood: 71994,
      landslide: 67446,
      'storm-surge': 25430,
      earthquake: 88455,
      tsunami: 40611,
      'large-fire': 43172,
      'inland-flood': 39411,
      volcanic: 10732,
    },
  },
  notes: [
    '指定緊急避難場所は災害の危険から緊急的に避難する場所、指定避難所は被災者等が一定期間滞在する施設です。両者を合算しません。',
    '災害種別ごとの「該当」は原典の1、「非該当」は原典の空欄です。非該当を安全・危険の判定に読み替えません。本取得分に不明の記号はありません。',
    '指定避難所のCSVには8災害の対応属性がありません。指定緊急避難場所の対応を、同じ住所の指定避難所へ移しません。',
    '掲載件数は共通ID単位です。同じ住所の一般避難所・福祉避難所・緊急避難場所が別IDで掲載される場合があります。住所一致は同一機能や一体運用を意味しません。',
    '市町村が登録し公開に同意した施設だけが対象です。未登録・一部種別のみ公開の自治体等を保持し、県内の全指定施設を網羅する数とは扱いません。',
    '公開一覧は北方領土の6地域を含む1747自治体等です。通常の全国市町村数を分母にした公表率ではありません。',
    '原典は随時更新されています。取得日は2026年9月11日、最新DB更新日は2026年9月4日です。自治体ごとに更新日が異なり、DB更新日は指定日ではありません。',
    '最新でない場合や未掲載の場合があります。実際の災害時の利用判断には、災害種別と自治体が発表する最新の指定状況・開設情報を確認してください。',
    '出典：国土地理院「指定緊急避難場所・指定避難所データ」をstats47が県別集計。個別避難計画の作成率や避難の成功率とは別の情報です。',
  ],
  files: [
    {
      filename: 'index.html',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/hinanbasho/koukaidate.html',
      sha256:
        'e50e62fd03b746dd832b46e73ed3573e035b85d4fe7a498902f261210860ee61',
      bytes: 21201,
      acquiredAt: '2026-09-10T15:57:18.363632+00:00',
    },
    {
      filename: 'country-meta.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/publicHistoryCSV/countrySetData.csv',
      sha256:
        'b3a95f7580c3e36ddc04a5f1a09cc500fd78fa30c2362928af4151d0d51d6558',
      bytes: 4,
      acquiredAt: '2026-09-10T15:58:07.445795+00:00',
    },
    {
      filename: 'pref-meta.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/publicHistoryCSV/prefectureListData.csv',
      sha256:
        '5b50228df8870930563e95b48d97ff21cd6c1f3e543ddb4b730388c7773e55f3',
      bytes: 1372,
      acquiredAt: '2026-09-10T15:58:07.533595+00:00',
    },
    {
      filename: 'gsi-license.html',
      url: 'https://web1.gsi.go.jp/kikakuchousei/kikakuchousei40182.html',
      sha256:
        '5388d2854a05f3e7b41cb980ecfb2de75b315de68e0d9c94b9334c11e580739e',
      bytes: 23271,
      acquiredAt: '2026-09-10T15:58:07.689455+00:00',
    },
    {
      filename: 'gsi-notes.html',
      url: 'https://web1.gsi.go.jp/bousaichiri/hinanbasho-menseki.html',
      sha256:
        'ea9723e2b52f572d90ab89b51a43f9c4c4728175bd3829d38b3b4ec6e063c7e9',
      bytes: 18198,
      acquiredAt: '2026-09-10T15:58:07.795044+00:00',
    },
    {
      filename: 'gsi-source.html',
      url: 'https://web1.gsi.go.jp/bousaichiri/hinanbasho.html',
      sha256:
        '5be2b62a61610aef5f61d6582862b7e1ea70c7f9eaf81ede5e5fbac91b4cff97',
      bytes: 23820,
      acquiredAt: '2026-09-10T15:58:07.902863+00:00',
    },
    {
      filename: 'emergency-national.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/mergeFromCity_2.csv',
      sha256:
        '20677ef8026d4bc96c770d18f72f0990bb40a8272be3ff9c2abaa7440ca9b033',
      bytes: 17003483,
      acquiredAt: '2026-09-10T15:59:04.414895+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-national.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/mergeFromCity_1.csv',
      sha256:
        '440617060fef23b74b51ecf6628621995dc5c3a080ea11e9d54a6f676997ca9e',
      bytes: 11692355,
      acquiredAt: '2026-09-10T15:59:05.649268+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'municipality-meta.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/publicHistoryCSV/publicHistoryListData.csv',
      sha256:
        '3830da13cfe2dc7d646f1d23c873aab106de44bea854a7c17e0422dab89adc24',
      bytes: 90459,
      acquiredAt: '2026-09-10T15:59:02.148741+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'notice.txt',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/assets/notice/%E3%81%94%E5%88%A9%E7%94%A8%E4%B8%8A%E3%81%AE%E6%B3%A8%E6%84%8F.txt',
      sha256:
        'eb7ab83ab8e60bdbb7a9df5c671172b0081d967257a30090bcb4dce4b313e597',
      bytes: 1091,
      acquiredAt: '2026-09-10T15:59:02.088277+00:00',
      lastModified: 'Wed, 01 Apr 2026 05:11:08 GMT',
    },
    {
      filename: 'common-id.pdf',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/hinanbasho/pdf/kyotsu_ID.pdf',
      sha256:
        'b21da3ea5cc8e1ee9188757e76efb62f65de85262039f71efabc812fe77dd6b0',
      bytes: 74506,
      acquiredAt: '2026-09-10T15:59:02.296368+00:00',
      lastModified: 'Mon, 26 Jan 2026 01:55:41 GMT',
    },
    {
      filename: 'emergency-01.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/01000_2.csv',
      sha256:
        '1db8f6c630fcd0db400ffc1cb85daa4e85d92e91f2a4f276b023cfdebb5a23b4',
      bytes: 923565,
      acquiredAt: '2026-09-10T15:59:03.365998+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-01.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/01000_1.csv',
      sha256:
        '087334d5ff0e65380689a2b47b6ddc1ab92024e0850d5dad866208e0ff419d78',
      bytes: 660392,
      acquiredAt: '2026-09-10T15:59:03.335326+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-02.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/02000_2.csv',
      sha256:
        '19218f5012237a38d066480b1652b65348f5eb20eeb221ec60e6e7f614539a2f',
      bytes: 311724,
      acquiredAt: '2026-09-10T15:59:04.429708+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-02.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/02000_1.csv',
      sha256:
        '000f4a5b385d8f19a5fb87ec5daeea975d54a2434803834bd339da55028ecc7d',
      bytes: 278012,
      acquiredAt: '2026-09-10T15:59:04.406873+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-03.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/03000_2.csv',
      sha256:
        '88d7ad533cf3de95b9d300b82f39972d12ef0a06edd3869332505cfd405a72c4',
      bytes: 351178,
      acquiredAt: '2026-09-10T15:59:04.712955+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-03.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/03000_1.csv',
      sha256:
        'f2408ab7072ec2eb9a6a6252e73e35016b7f748d7f4a1dd5e26ebeacd19f6871',
      bytes: 196641,
      acquiredAt: '2026-09-10T15:59:04.678179+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-04.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/04000_2.csv',
      sha256:
        '0b8f2b02810e2754fbe65a82d669de55c4af2da2ba09ecfe027a385f966c910c',
      bytes: 320253,
      acquiredAt: '2026-09-10T15:59:04.728910+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-04.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/04000_1.csv',
      sha256:
        '816789e7fcf6214fd4f6fd80ee7bf5905ac6446e50291d56c6e0ce688d055180',
      bytes: 209440,
      acquiredAt: '2026-09-10T15:59:04.926237+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-05.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/05000_2.csv',
      sha256:
        'c6ccf0630667940fa6cb976fbe716fe2a1f197e020c296da62cc09f8ce738e14',
      bytes: 281356,
      acquiredAt: '2026-09-10T15:59:05.071166+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-05.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/05000_1.csv',
      sha256:
        'd449eeb540f2888e84e8e8b95f3b20a89c6beaad08f5090b4dc0ddd18b641b84',
      bytes: 160665,
      acquiredAt: '2026-09-10T15:59:05.013079+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-06.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/06000_2.csv',
      sha256:
        '5c9edd6aaca406db9b93c3dbd268f3af3c14e937fc38d40155deb1e22eb73c18',
      bytes: 337583,
      acquiredAt: '2026-09-10T15:59:05.391453+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-06.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/06000_1.csv',
      sha256:
        '42718c9336ca6034e2a706b0ae4b6b8b5e3a322d185da3f12517279064af16d6',
      bytes: 143068,
      acquiredAt: '2026-09-10T15:59:05.379585+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-07.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/07000_2.csv',
      sha256:
        '06add070e830886d9f9b25582b3a1b4347be05dca62086d82433449b7835e4ec',
      bytes: 331846,
      acquiredAt: '2026-09-10T15:59:05.577145+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-07.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/07000_1.csv',
      sha256:
        '30b60184b361338f1a70da93e90c1b49ba941883da9306d93382ca6bb9ae39e6',
      bytes: 328609,
      acquiredAt: '2026-09-10T15:59:05.753281+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-08.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/08000_2.csv',
      sha256:
        '49d7cd57ceade6d62f89a9c4932d233a162a60444e73462cfa90ac7657ab15f3',
      bytes: 248131,
      acquiredAt: '2026-09-10T15:59:05.741500+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-08.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/08000_1.csv',
      sha256:
        'cb20170bee556171b71a76b99cae91030a90635b95eb1ccab9c83bced4bb1ce1',
      bytes: 193988,
      acquiredAt: '2026-09-10T15:59:05.794326+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-09.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/09000_2.csv',
      sha256:
        'e313e5608e5af20d53f713c7087c6f4802394dd8f43cf72691d2b8481eda5227',
      bytes: 150779,
      acquiredAt: '2026-09-10T15:59:05.869145+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-09.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/09000_1.csv',
      sha256:
        '439ad6723c5a00f4caf83e17ed780cf883c749550086b01a8400d5ca260336ee',
      bytes: 152848,
      acquiredAt: '2026-09-10T15:59:05.928798+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-10.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/10000_2.csv',
      sha256:
        '8c86051552b74fddadf3a7cf52f301dce5542c0faaa6f42f49f1055b0c6106e1',
      bytes: 215557,
      acquiredAt: '2026-09-10T15:59:05.962338+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-10.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/10000_1.csv',
      sha256:
        'b7155889a56bf18c93e3beca93f6e415726a7e626449f1d81892a55b9f5357c6',
      bytes: 197421,
      acquiredAt: '2026-09-10T15:59:05.991357+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-11.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/11000_2.csv',
      sha256:
        'b748218281f25437e5718b5c321cbf16779dcb38550fb3def0629376495d0495',
      bytes: 346455,
      acquiredAt: '2026-09-10T15:59:06.081130+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-11.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/11000_1.csv',
      sha256:
        '26f26ac60c8fc44ae7f6db2d2926449071c3d464dfa0e33f20bf6e111f5bf986',
      bytes: 288085,
      acquiredAt: '2026-09-10T15:59:06.187822+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-12.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/12000_2.csv',
      sha256:
        'f4b5765ea0692905d3ef8efbd8bc96743c2518a91bc6b6c3019a0d2016336041',
      bytes: 363472,
      acquiredAt: '2026-09-10T15:59:06.229170+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-12.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/12000_1.csv',
      sha256:
        '1bcd62b99142825f839296b52bed6d5f0fc61ef72e46092aaa1157d00c5b73e0',
      bytes: 260173,
      acquiredAt: '2026-09-10T15:59:06.257275+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-13.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/13000_2.csv',
      sha256:
        '760e856f30ba0d1a3e29664cf7adc1cc868cd66d90800f35d1936585c4522d0b',
      bytes: 286449,
      acquiredAt: '2026-09-10T15:59:06.349859+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-13.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/13000_1.csv',
      sha256:
        '4c4206123a90c4514252bd2670df09645bd415b5eba02d85e95e98b74cae2dfa',
      bytes: 372307,
      acquiredAt: '2026-09-10T15:59:06.393487+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-14.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/14000_2.csv',
      sha256:
        'f3c2818bdebd20447b6746354309d437bb21e09cdc13dc5cd5875c56f0c5366c',
      bytes: 469682,
      acquiredAt: '2026-09-10T15:59:06.491293+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-14.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/14000_1.csv',
      sha256:
        '67d78a2f678f5b799d94e6317342c1131def65c17d6d64ac5ef85327a120d5ee',
      bytes: 189335,
      acquiredAt: '2026-09-10T15:59:06.487013+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-15.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/15000_2.csv',
      sha256:
        '4d5f29257d98f7d5ec945061513f6f9353c433e50b5662d902555a3ce103084f',
      bytes: 361446,
      acquiredAt: '2026-09-10T15:59:06.602449+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-15.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/15000_1.csv',
      sha256:
        '73ca781b89fb4750f58168f6b48ed5e643c21e1f04f1136c7011a45add7cbabe',
      bytes: 277968,
      acquiredAt: '2026-09-10T15:59:06.638178+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-16.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/16000_2.csv',
      sha256:
        '32da53aaf7a6ea54d782338adfc268ff199faa05167325154bb006b03b8a9b8d',
      bytes: 183274,
      acquiredAt: '2026-09-10T15:59:06.672382+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-16.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/16000_1.csv',
      sha256:
        '0e5d1abcd7f1a3453a3229423105c712d3de9892fe25b8812225412f73263920',
      bytes: 109979,
      acquiredAt: '2026-09-10T15:59:06.656741+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-17.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/17000_2.csv',
      sha256:
        'bfcac0ffd6e4a59381ad0b7619f52ef7fc86d3698547c986ab94e35eeeea5351',
      bytes: 191510,
      acquiredAt: '2026-09-10T15:59:06.803989+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-17.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/17000_1.csv',
      sha256:
        '73df0798a9a4412edc662c96e1fa67221d3e0baba75bd0b88d9bb29d7d319f67',
      bytes: 110468,
      acquiredAt: '2026-09-10T15:59:06.833609+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-18.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/18000_2.csv',
      sha256:
        '90de5151db0fc9abe6eefffbd5b6cb7b83109991dde8d17e8b1eb21ecdc17074',
      bytes: 147822,
      acquiredAt: '2026-09-10T15:59:06.853841+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-18.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/18000_1.csv',
      sha256:
        '05efc1847bf9f8617c143268988a919d37978d23406dbfc04334316416af6c16',
      bytes: 103841,
      acquiredAt: '2026-09-10T15:59:06.856072+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-19.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/19000_2.csv',
      sha256:
        '267de999a31a490a00dbf284369d8304cfe48255583b03885614c4216b29f1db',
      bytes: 125893,
      acquiredAt: '2026-09-10T15:59:06.961770+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-19.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/19000_1.csv',
      sha256:
        '7c1e02b3a5bd7202402519d14dcfa9f9ca6c13e8d17c991c5b9aa43eb7f5066c',
      bytes: 97829,
      acquiredAt: '2026-09-10T15:59:06.972409+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-20.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/20000_2.csv',
      sha256:
        'd1e97bd3b4b3a352a399e672673704c1c07817d0b978ff4b6f964d6df68f7c9c',
      bytes: 469340,
      acquiredAt: '2026-09-10T15:59:07.116062+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'shelter-20.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/20000_1.csv',
      sha256:
        '7e51d3d968adb71fddc1b7668042fc4fcc753e2a5fa693244c31b1d4a745a985',
      bytes: 377311,
      acquiredAt: '2026-09-10T15:59:07.089827+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:27 GMT',
    },
    {
      filename: 'emergency-21.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/21000_2.csv',
      sha256:
        'e360c149e5a705138017ea15557f20940d5c377992ec3c1041c83cefd182a1c8',
      bytes: 384006,
      acquiredAt: '2026-09-10T15:59:07.238529+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-21.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/21000_1.csv',
      sha256:
        'dbbef943d626ee26bf11123d57e658c54a260c288bac1a2d609ac268838bf69c',
      bytes: 220159,
      acquiredAt: '2026-09-10T15:59:07.210611+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-22.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/22000_2.csv',
      sha256:
        'eadb259de11725c25bb8fe6ae6faf56978a805931d8a12c1955aecdc8675c06a',
      bytes: 361913,
      acquiredAt: '2026-09-10T15:59:07.303230+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-22.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/22000_1.csv',
      sha256:
        '7f87c1bb59fc782fd503ba48b555520f932e594897013d8b2eba3b5f91d5683b',
      bytes: 197497,
      acquiredAt: '2026-09-10T15:59:07.312959+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-23.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/23000_2.csv',
      sha256:
        '86d0cf6d819ebd05d30d5ee16a838224dc7fe12a2863d6b4e2495cae2f9a8cc4',
      bytes: 729733,
      acquiredAt: '2026-09-10T15:59:07.522695+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-23.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/23000_1.csv',
      sha256:
        '3515eedc1b35d57918724d4670acb0b56825641c83082cae02088c749c3e12b0',
      bytes: 374915,
      acquiredAt: '2026-09-10T15:59:07.534481+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-24.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/24000_2.csv',
      sha256:
        'e96a47fa74d7304b4bc6ade8ce9200311ff26a08b3b6d1f56d225f67322f73bb',
      bytes: 497329,
      acquiredAt: '2026-09-10T15:59:07.751144+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-24.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/24000_1.csv',
      sha256:
        '7fd638537dcbadf54865e74f94696bedd48e857a6c002f4c7e432e721d770e8e',
      bytes: 221887,
      acquiredAt: '2026-09-10T15:59:07.581810+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-25.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/25000_2.csv',
      sha256:
        'f36abcf0a87196a5df6cb2a947d8a76b3ff9fb7c828c08374b0d9aab1d7a4e68',
      bytes: 122089,
      acquiredAt: '2026-09-10T15:59:07.718981+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-25.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/25000_1.csv',
      sha256:
        'b968d88499e490a9d151860559058d115fea253426cb71d5a2a532d0261c344a',
      bytes: 125431,
      acquiredAt: '2026-09-10T15:59:07.728591+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-26.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/26000_2.csv',
      sha256:
        '68bb9165a4e64ba68ed5fdd91ed9a85c39d31f772275152c0a095e25ce20c94f',
      bytes: 190364,
      acquiredAt: '2026-09-10T15:59:07.784158+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-26.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/26000_1.csv',
      sha256:
        'dd210090f3af138997c64f6df29ee64137abaae6076251985b9f8b16bd8cef87',
      bytes: 161670,
      acquiredAt: '2026-09-10T15:59:07.879058+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-27.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/27000_2.csv',
      sha256:
        '9cc1fe3314f3b85e50ca71fe0cbc2166181877c6f028700c089ab2735d955eb1',
      bytes: 698443,
      acquiredAt: '2026-09-10T15:59:08.029624+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-27.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/27000_1.csv',
      sha256:
        '5b1dfee3ed5c1f80ce21e7d513dc6c66403c54e2a00e7b2e933df434551497f6',
      bytes: 359069,
      acquiredAt: '2026-09-10T15:59:07.996728+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-28.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/28000_2.csv',
      sha256:
        'edbad9a961ef1455264e72a88b22d8d34cfcbf6165c53ffeededb9d9aa9ca72f',
      bytes: 444770,
      acquiredAt: '2026-09-10T15:59:08.113267+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-28.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/28000_1.csv',
      sha256:
        'c13977c6c3d7d9f6c745439d619ebe9c4fce211eb30e1ec52221e250f5ae5497',
      bytes: 367471,
      acquiredAt: '2026-09-10T15:59:08.154674+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-29.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/29000_2.csv',
      sha256:
        'b4a1cb3ee454d9cac440a6b254d7d47f539516091b7c1b7538f68365f19b3526',
      bytes: 154090,
      acquiredAt: '2026-09-10T15:59:08.182659+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-29.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/29000_1.csv',
      sha256:
        '7c2cfa6559347189d09ace7d04275ee5992033774e17474912fdc12ed9149868',
      bytes: 122270,
      acquiredAt: '2026-09-10T15:59:08.208856+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-30.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/30000_2.csv',
      sha256:
        'd7c0856349cc9d9cec1ba9290928316d2c6f20a5c25194c41480f4a97df3d7f9',
      bytes: 317140,
      acquiredAt: '2026-09-10T15:59:08.332469+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-30.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/30000_1.csv',
      sha256:
        'dc760cda8ac776b89fec2f878287815b4f64c0c170d661ae4ec9734a4cb05881',
      bytes: 193290,
      acquiredAt: '2026-09-10T15:59:08.354430+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-31.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/31000_2.csv',
      sha256:
        'a4d7d7dd1d22de44c4cfd24f8070ac269a7ee3b179cc1ee5abfdf7858402b285',
      bytes: 184604,
      acquiredAt: '2026-09-10T15:59:08.393463+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-31.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/31000_1.csv',
      sha256:
        'cdf980f466337ec29baeddbd697ceea740f4c008504f453da28c03890a746c51',
      bytes: 68046,
      acquiredAt: '2026-09-10T15:59:08.391019+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-32.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/32000_2.csv',
      sha256:
        '9d055bf9e4be030bc8429d136e11047d89e687e2049e92e19f9e1f3aea0effc5',
      bytes: 168227,
      acquiredAt: '2026-09-10T15:59:08.504338+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-32.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/32000_1.csv',
      sha256:
        'e42f8ae0b550ede0e8879a8b7a0b38afbdbf85f68e826ca23af03882861a349f',
      bytes: 162916,
      acquiredAt: '2026-09-10T15:59:08.523985+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-33.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/33000_2.csv',
      sha256:
        '6a3eaed77f19b54b0284086b3cb124ae900a75bb8ef514230ee08a575b14404c',
      bytes: 314557,
      acquiredAt: '2026-09-10T15:59:08.622658+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-33.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/33000_1.csv',
      sha256:
        '51e7b8eed0affe2824e8e78733cb9a4aace272b3830b2148f097f2142d8a914e',
      bytes: 202702,
      acquiredAt: '2026-09-10T15:59:08.609870+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-34.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/34000_2.csv',
      sha256:
        'cba88ba5f8761518adee09ff58a2d1e2de6fa92b09411c9b25aa1ec461819570',
      bytes: 386072,
      acquiredAt: '2026-09-10T15:59:08.792742+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-34.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/34000_1.csv',
      sha256:
        '83dc62077934398af1153bec29cd997b7fae7e61ed999dda606d2510f9923b53',
      bytes: 238421,
      acquiredAt: '2026-09-10T15:59:08.774519+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-35.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/35000_2.csv',
      sha256:
        'b2987e2082f88f49798f84f3b052e507a511fee6a08bd8c536d0690c8e3024a1',
      bytes: 214861,
      acquiredAt: '2026-09-10T15:59:08.819075+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-35.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/35000_1.csv',
      sha256:
        'a9342ef12f0c9d3c778e1aa4abf43b0d100f4e32359fc332198fcd6585a6a628',
      bytes: 139245,
      acquiredAt: '2026-09-10T15:59:08.811251+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-36.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/36000_2.csv',
      sha256:
        '41ed0a497f9b191a1623c440fd9c1e44e32286c765003f0974a6d07e9d8dd94f',
      bytes: 306055,
      acquiredAt: '2026-09-10T15:59:09.004661+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-36.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/36000_1.csv',
      sha256:
        '9d9ff66d25709106d2d5935f26d5b88a232b2cbcc339bbbb18aaac3a83c86965',
      bytes: 137982,
      acquiredAt: '2026-09-10T15:59:08.975613+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-37.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/37000_2.csv',
      sha256:
        'b3c7f9369cfe333701861b054dbe7350be8f6af56afd722c04bcfbd04e966203',
      bytes: 120804,
      acquiredAt: '2026-09-10T15:59:09.007940+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-37.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/37000_1.csv',
      sha256:
        '20131387ad246776b212a4c3ef8d85153ac668d2b2208a81c5b723c668f569b4',
      bytes: 77529,
      acquiredAt: '2026-09-10T15:59:08.988613+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-38.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/38000_2.csv',
      sha256:
        'b12ae8f3232c41608db41a56f5ea6da6db543453646ddc4e986db40d8d06b6e2',
      bytes: 258779,
      acquiredAt: '2026-09-10T15:59:09.212681+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-38.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/38000_1.csv',
      sha256:
        'ba7acc4bd16beb16a436c731b61200312ba3fe088ecd055001c5aed464e1318b',
      bytes: 272642,
      acquiredAt: '2026-09-10T15:59:09.211361+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-39.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/39000_2.csv',
      sha256:
        '5e43d2b13c04a306ce503731989ce766d9c4ec76a450928e7f39dd00b776b61f',
      bytes: 333473,
      acquiredAt: '2026-09-10T15:59:09.243912+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-39.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/39000_1.csv',
      sha256:
        '1e36f5e813d556474d0ea472a1d5a562c6be2e1dfed9c1500f5c1c95a3083ed2',
      bytes: 221090,
      acquiredAt: '2026-09-10T15:59:09.216770+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-40.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/40000_2.csv',
      sha256:
        '83cb507f13f219fd231a9d478a047b73caf67ad6a8245d38a255f3a68759377d',
      bytes: 431629,
      acquiredAt: '2026-09-10T15:59:09.418378+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-40.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/40000_1.csv',
      sha256:
        'bc139156ead82b301376b3c30c2bbfacb90f85baaebeb264edcf72c502fc8899',
      bytes: 316233,
      acquiredAt: '2026-09-10T15:59:09.420558+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-41.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/41000_2.csv',
      sha256:
        'b86f57e2196a274f84a339708d6b674f71efc03cd4c141697d2a9482bbd276db',
      bytes: 59206,
      acquiredAt: '2026-09-10T15:59:09.360405+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-41.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/41000_1.csv',
      sha256:
        '599ec30d1590a5f6e2eed63aed202aeb651daf438c54cfdbc1fe9578156eeb43',
      bytes: 76845,
      acquiredAt: '2026-09-10T15:59:09.393726+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-42.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/42000_2.csv',
      sha256:
        '16d0d93ee39d53ba9a4d2fbbc7218dde8cd2dcb1de9d6cb3d68735cbdff768db',
      bytes: 228199,
      acquiredAt: '2026-09-10T15:59:09.569645+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-42.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/42000_1.csv',
      sha256:
        '19555d8118ffe9ede2b804725ff2b6ecf41fba6fc3ade64c478771e2072875e6',
      bytes: 171973,
      acquiredAt: '2026-09-10T15:59:09.589799+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-43.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/43000_2.csv',
      sha256:
        '2606c286027616744c110e03792f4dfb050a6a85fdfab93b4d2452072ac5969e',
      bytes: 210222,
      acquiredAt: '2026-09-10T15:59:09.613470+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-43.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/43000_1.csv',
      sha256:
        'a04f16cf2e53aec5caadda9c0d925342964483a45870933ec9882c48e957ea60',
      bytes: 154980,
      acquiredAt: '2026-09-10T15:59:09.615126+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-44.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/44000_2.csv',
      sha256:
        '775fbfae37dc4541f2f25b3487632f4d1419d016c36b4737c493a196ce0f17c4',
      bytes: 228143,
      acquiredAt: '2026-09-10T15:59:09.783904+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-44.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/44000_1.csv',
      sha256:
        '23079c7ddce8e787261a93a310a668e71170240be974d9b9f5936a89263b0aa0',
      bytes: 131597,
      acquiredAt: '2026-09-10T15:59:09.788879+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-45.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/45000_2.csv',
      sha256:
        'a9e581acfa44f9471285cb5c1966479e1e2454f08980f9e3000126fec1ecbeb9',
      bytes: 289107,
      acquiredAt: '2026-09-10T15:59:09.846505+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-45.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/45000_1.csv',
      sha256:
        '3e911ff607eedc16c7f4d40870c6c732958d8d834880ad5bb5096206459b3aa8',
      bytes: 156007,
      acquiredAt: '2026-09-10T15:59:09.811967+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-46.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/46000_2.csv',
      sha256:
        'feb7e1f470c3f80576aabfca9991e0449b378753187765dd822272b4d60c6473',
      bytes: 318564,
      acquiredAt: '2026-09-10T15:59:09.982676+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-46.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/46000_1.csv',
      sha256:
        '290a7dddb8e7e9629b9a750d7363be1372036abf39529bf28254026b82e2cb44',
      bytes: 238347,
      acquiredAt: '2026-09-10T15:59:09.985612+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'emergency-47.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/47000_2.csv',
      sha256:
        '232038c176b3b8396ab6705458fb9cc4991fec113cda236e79ba35626687a434',
      bytes: 169611,
      acquiredAt: '2026-09-10T15:59:09.974273+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
    {
      filename: 'shelter-47.csv',
      url: 'https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/47000_1.csv',
      sha256:
        'dfacccef4eaf8b31c00197e2ab9c962d3ec8f03f89f44e8532943c002c6c822e',
      bytes: 99028,
      acquiredAt: '2026-09-10T15:59:10.026902+00:00',
      lastModified: 'Mon, 07 Sep 2026 07:50:28 GMT',
    },
  ],
} as const;
