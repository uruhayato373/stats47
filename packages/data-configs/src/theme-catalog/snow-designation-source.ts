/** Official fixed inputs and reference documents; observations are derived, not authored here. */
export const SNOW_DESIGNATION_SOURCE = {
  slug: 'population-snow-designation',
  dataVersion: 'A22-16_m250r6-24_PTN2020_center-v1',
  r2Root: 'app/geo/population-snow-designation',
  canonicalPath: '/geo/population-snow-designation',
  sectionKey: 'snow-designation-population',
  designationEdition: '2016年度（A22-16 / v3.0）',
  populationYear: 2020,
  populationField: 'PTN_2020',
  populationScale: 10000,
  designatedPrefectures: [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '09',
    '10',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '25',
    '26',
    '28',
    '31',
    '32',
    '33',
    '34',
  ],
  snow: {
    datasetId: 'A22',
    version: '16',
    title: '国土数値情報 豪雪地帯データ（2016年度）',
    pageUrl: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A22-v3_0.html',
    license: '商用可（旧国土情報利用約款準拠版）',
    licenseKey: 'commercial-ok',
    licenseUrl: 'https://nlftp.mlit.go.jp/ksj/other/agreement_02.html',
    specUrl: 'https://nlftp.mlit.go.jp/ksj/gml/product_spec/KS-PS-A22-v3_0.pdf',
    classField: 'A22_009',
    classes: {
      '1': '豪雪地帯',
      '2': '特別豪雪地帯',
    },
    crs: 'JGD2011（EPSG:6668）',
    attribution:
      '国土交通省 国土数値情報「豪雪地帯データ」をstats47が加工。地理院承認 平28情使 第1049号。',
  },
  population: {
    datasetId: 'm250r6',
    version: '24',
    title:
      '国土数値情報 250mメッシュ別将来推計人口データ（R6国政局推計）の2020年基準人口',
    pageUrl:
      'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh250r6.html',
    license: 'CC BY 4.0',
    licenseKey: 'cc-by-4.0',
    licenseUrl: 'https://nlftp.mlit.go.jp/ksj/other/agreement_01.html',
    methodUrl:
      'https://nlftp.mlit.go.jp/ksj/gml/datalist/r6_about_future_population.pdf',
    attribution:
      '国土交通省 国土数値情報「250mメッシュ別将来推計人口データ（R6国政局推計）」をstats47が加工（CC BY 4.0）。',
  },
  notes: [
    '2016年度の指定ポリゴンに、2020年基準人口の250mメッシュ中心を重ねた集計。現在の法指定人口を直接調べた値ではありません。',
    '2020年人口は、国勢調査の性・年齢不詳補完と市町村別総数調整を行ったKSJの基準人口です。未調整の国勢調査メッシュ公表値とは一致しない場合があります。',
    '人口行の県・市町村帰属は原典SHICODEを保持します。県境で同じ格子番号があっても、県＋SHICODE＋MESH_IDの別行を削除しません。',
    '中心点が入力ポリゴン外でも、そのメッシュの居住地が法指定外とは限りません。海岸・市町村境界等を横切るメッシュ人口を別に表示します。',
    '人口の面積按分は行いません。中心包含人口と、格子全体が区域内／一部でも交差する場合の人口を区別します。交差範囲は統計的信頼区間ではありません。',
    '面積は原典形状の和集合からGRS80楕円体で算出したGIS面積です。国土地理院の公表面積や2025年10月1日の豪雪指定面積191,992km²とは算出法・時点が異なります。',
    '全国人口18,248千人の公式概要は仙台市・郡山市・静岡市・大津市の部分指定地域を除きます。本分析の人口とは対象が一致しません。',
    '福島県檜枝岐村の原典ポリゴン1件の自己交差をGEOS make_valid(linework)で処理し、修復と面積差を県別証拠へ記録します。',
    '地図境界は表示時だけ20mで簡略化しています。中心包含・面積・境界感度の計算は簡略化前の原典形状を使用します。',
  ],
  snowSources: [
    {
      filename: 'A22-16_01_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_01_GML.zip',
      bytes: 34143692,
      sha256:
        'dd448c146b0636bc0490b3ab2be81a004140865c9ac308e58a98f4c4610916d1',
      fetchedAt: '2026-09-10T15:24:30.488199+00:00',
      areaCode: '01000',
    },
    {
      filename: 'A22-16_02_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_02_GML.zip',
      bytes: 6557521,
      sha256:
        '2348ebe4fe1397edb2a35cd5853d61cedea2d7656328f6965e520dc8700ea466',
      fetchedAt: '2026-09-10T15:24:30.488363+00:00',
      areaCode: '02000',
    },
    {
      filename: 'A22-16_03_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_03_GML.zip',
      bytes: 18522477,
      sha256:
        'a5fedcd9f09fc4c44e0e6fc9c76ef3d3eec7b8682abb878b7b7b00bec6c68ceb',
      fetchedAt: '2026-09-10T15:24:30.488458+00:00',
      areaCode: '03000',
    },
    {
      filename: 'A22-16_04_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_04_GML.zip',
      bytes: 1206541,
      sha256:
        'efe49185ffbc7784787aa877c2e02ef480e2be53bf40ad4f55a5fdcb1a61ac49',
      fetchedAt: '2026-09-10T15:24:33.494798+00:00',
      areaCode: '04000',
    },
    {
      filename: 'A22-16_05_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_05_GML.zip',
      bytes: 6007600,
      sha256:
        'bef9c90a6a3b8dc61dec772b3b0a889642e7df0c0a8c23423836d84e3fcaeda5',
      fetchedAt: '2026-09-10T15:24:35.425970+00:00',
      areaCode: '05000',
    },
    {
      filename: 'A22-16_06_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_06_GML.zip',
      bytes: 3923883,
      sha256:
        '97f005fe3cfcd595bfa2b9da0a7612bcb7cbe57206d7812d48640642a346d2b9',
      fetchedAt: '2026-09-10T15:24:35.747124+00:00',
      areaCode: '06000',
    },
    {
      filename: 'A22-16_07_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_07_GML.zip',
      bytes: 3813361,
      sha256:
        'b07eb4c8889c5a001f99f9b4f4b5b879354ad2406829486181d598a965d7aa38',
      fetchedAt: '2026-09-10T15:24:37.395049+00:00',
      areaCode: '07000',
    },
    {
      filename: 'A22-16_09_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_09_GML.zip',
      bytes: 820282,
      sha256:
        'a53bfe8493694352bbda579d97e28e98354235c2c53c1187677f8b09778b94ec',
      fetchedAt: '2026-09-10T15:24:38.101305+00:00',
      areaCode: '09000',
    },
    {
      filename: 'A22-16_10_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_10_GML.zip',
      bytes: 1792245,
      sha256:
        'ff9e3d76c2ae97803c7963e06729c4adc9c90526d450e0d8f2540c7cb12c50f1',
      fetchedAt: '2026-09-10T15:24:38.552525+00:00',
      areaCode: '10000',
    },
    {
      filename: 'A22-16_15_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_15_GML.zip',
      bytes: 7154870,
      sha256:
        '4d7ac76c097c7f29ca488734f1e2224575510a26c0a58cc1138485183d7e4270',
      fetchedAt: '2026-09-10T15:24:38.682521+00:00',
      areaCode: '15000',
    },
    {
      filename: 'A22-16_16_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_16_GML.zip',
      bytes: 1902149,
      sha256:
        'edf2bfbb124aea79304c458a086f1a598ed062760fceff412aa24c17e4e9fc7f',
      fetchedAt: '2026-09-10T15:24:38.722826+00:00',
      areaCode: '16000',
    },
    {
      filename: 'A22-16_17_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_17_GML.zip',
      bytes: 4211448,
      sha256:
        '47ae239a865a530fd2a59b6f29437a4405c7dcdcb956148b99aa98f834adf6b0',
      fetchedAt: '2026-09-10T15:24:39.017500+00:00',
      areaCode: '17000',
    },
    {
      filename: 'A22-16_18_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_18_GML.zip',
      bytes: 5197638,
      sha256:
        '6f7ece3d77cae8185420dab5f0e26f1bb2cf17d797bfaabdda3c84a48a98c115',
      fetchedAt: '2026-09-10T15:24:39.326674+00:00',
      areaCode: '18000',
    },
    {
      filename: 'A22-16_19_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_19_GML.zip',
      bytes: 367398,
      sha256:
        '595d87263b1d5dbc720ae5f04d927356a51f8db30888226d79ba328e23228216',
      fetchedAt: '2026-09-10T15:24:40.141555+00:00',
      areaCode: '19000',
    },
    {
      filename: 'A22-16_20_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_20_GML.zip',
      bytes: 1907922,
      sha256:
        'c8a0fdaa24b9449f908193d1fd0373189542f6c4019788b12866e30ba8256912',
      fetchedAt: '2026-09-10T15:24:40.445690+00:00',
      areaCode: '20000',
    },
    {
      filename: 'A22-16_21_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_21_GML.zip',
      bytes: 1253278,
      sha256:
        'bd3d7758fb6b1e6a7968189eeec2d7dcda7ebc589629417bdae08744a3ac6ac3',
      fetchedAt: '2026-09-10T15:24:40.571659+00:00',
      areaCode: '21000',
    },
    {
      filename: 'A22-16_22_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_22_GML.zip',
      bytes: 428825,
      sha256:
        'c9d277a884b6519457e1ded5e3fc1978299e574361abe4f1db3cc5fd1e66d3f2',
      fetchedAt: '2026-09-10T15:24:40.956999+00:00',
      areaCode: '22000',
    },
    {
      filename: 'A22-16_25_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_25_GML.zip',
      bytes: 494111,
      sha256:
        '1c05745e1288a0d0a3bdf2d30dd349613cb636a14499256d9c55cba536d730bf',
      fetchedAt: '2026-09-10T15:24:41.148132+00:00',
      areaCode: '25000',
    },
    {
      filename: 'A22-16_26_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_26_GML.zip',
      bytes: 2870171,
      sha256:
        'e43161653b917e63dcc2b0935b9a3575316ca8f463bbd0ed77e13b5931386d38',
      fetchedAt: '2026-09-10T15:24:41.175673+00:00',
      areaCode: '26000',
    },
    {
      filename: 'A22-16_28_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_28_GML.zip',
      bytes: 3590168,
      sha256:
        'c10d7fe42dd77c263c096f4fc98381dc8d9822357019b61377284b80b09d8b1b',
      fetchedAt: '2026-09-10T15:24:41.228091+00:00',
      areaCode: '28000',
    },
    {
      filename: 'A22-16_31_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_31_GML.zip',
      bytes: 2421575,
      sha256:
        '61ef4a6085131114fa90382c32a7225ef1945852537ce50e9d810a7c1130df30',
      fetchedAt: '2026-09-10T15:24:41.333630+00:00',
      areaCode: '31000',
    },
    {
      filename: 'A22-16_32_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_32_GML.zip',
      bytes: 846770,
      sha256:
        'db16a21623795b5be9f8f35d43fa26c367ddf9ad60b983096f114769d36ee746',
      fetchedAt: '2026-09-10T15:24:41.810269+00:00',
      areaCode: '32000',
    },
    {
      filename: 'A22-16_33_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_33_GML.zip',
      bytes: 707827,
      sha256:
        '6f4bca8c11c7a802453eb6a24618d7090278020d7460ea28c1ab0ed98172021a',
      fetchedAt: '2026-09-10T15:24:42.297397+00:00',
      areaCode: '33000',
    },
    {
      filename: 'A22-16_34_GML.zip',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A22/A22-16/A22-16_34_GML.zip',
      bytes: 769001,
      sha256:
        '8dd7a044fb08d939afd53ef2f4574b657864cb8a47d31bc7c68a33059dad6cb6',
      fetchedAt: '2026-09-10T15:24:42.335831+00:00',
      areaCode: '34000',
    },
  ],
  populationSources: [
    {
      id: 'population-01',
      areaCode: '01000',
      areaName: '北海道',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_01_SHP.zip',
      sha256:
        '9b54d8a4821bb91f642908af1143ac2b626e84bd937af9a3992be5c3d2e946ee',
      bytes: 39461665,
    },
    {
      id: 'population-02',
      areaCode: '02000',
      areaName: '青森県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_02_SHP.zip',
      sha256:
        '1ca9f933aa31c014148c792ff36f2a9dc7d05671ab9833e40c772744b50eb6c0',
      bytes: 13201718,
    },
    {
      id: 'population-03',
      areaCode: '03000',
      areaName: '岩手県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_03_SHP.zip',
      sha256:
        '6d897540dfe0c341d1bf7db422fd1965be065265429a35a5d3510545f6f61af0',
      bytes: 20285723,
    },
    {
      id: 'population-04',
      areaCode: '04000',
      areaName: '宮城県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_04_SHP.zip',
      sha256:
        'c752ad70f643d8fa16bc8bcc2b5f54fef7028d2d3e69ca3ece37501594e7d285',
      bytes: 19915373,
    },
    {
      id: 'population-05',
      areaCode: '05000',
      areaName: '秋田県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_05_SHP.zip',
      sha256:
        '24858b16e383ae988c98c08dd68bae8c4648e7352437c2325dce7e7d2f10ba91',
      bytes: 13148078,
    },
    {
      id: 'population-06',
      areaCode: '06000',
      areaName: '山形県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_06_SHP.zip',
      sha256:
        '2b7a751cc3901292b65cea7f678d4ca61339a09bbf5c20f817b0bdc5f0ee4eca',
      bytes: 12383953,
    },
    {
      id: 'population-07',
      areaCode: '07000',
      areaName: '福島県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_07_SHP.zip',
      sha256:
        'd2c6ea67a7ef1eeb411fae338f32731e6908405fa87f5b942fcef9c393c1090e',
      bytes: 24186647,
    },
    {
      id: 'population-08',
      areaCode: '08000',
      areaName: '茨城県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_08_SHP.zip',
      sha256:
        '4bf8103cfa4a2feed99ce69aa69959bc23440abf162fd369b2673830beeae57d',
      bytes: 33353372,
    },
    {
      id: 'population-09',
      areaCode: '09000',
      areaName: '栃木県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_09_SHP.zip',
      sha256:
        '7b550ae4818f96154eefc07d8d9244e185583b6e881a6fb277a0941ec8b0a9fd',
      bytes: 23031993,
    },
    {
      id: 'population-10',
      areaCode: '10000',
      areaName: '群馬県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_10_SHP.zip',
      sha256:
        '2dd92074db459650654aba37fbe0e6fc75710c1ae4e4b59f3924d0416e1e585b',
      bytes: 18706592,
    },
    {
      id: 'population-11',
      areaCode: '11000',
      areaName: '埼玉県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_11_SHP.zip',
      sha256:
        '3952b5c62c9a6534676c09a29cb88e2dbdea48a2d5dfcf2c5f84e66bd497d614',
      bytes: 29602194,
    },
    {
      id: 'population-12',
      areaCode: '12000',
      areaName: '千葉県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_12_SHP.zip',
      sha256:
        'd6ab429091435c8d98a2f74d8f3c5bafad06c10c5fcff04497e7e4dc4e4570ed',
      bytes: 33058979,
    },
    {
      id: 'population-13',
      areaCode: '13000',
      areaName: '東京都',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_13_SHP.zip',
      sha256:
        'ce5f07f1e1164a1ef7e3803a527f78712a9f63f0a61e31bb87e2ff6185711d3d',
      bytes: 19638063,
    },
    {
      id: 'population-14',
      areaCode: '14000',
      areaName: '神奈川県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_14_SHP.zip',
      sha256:
        'a74b68266a6d48c1bb83f08bd8affd2d77125d552af31c3dd62073d0964bb413',
      bytes: 20804106,
    },
    {
      id: 'population-15',
      areaCode: '15000',
      areaName: '新潟県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_15_SHP.zip',
      sha256:
        '1ba30f77602ef9de82d0eb969f9a44caf539db89b0bfb8c0c909f67b446ddcb6',
      bytes: 21796659,
    },
    {
      id: 'population-16',
      areaCode: '16000',
      areaName: '富山県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_16_SHP.zip',
      sha256:
        '91f07b687d56602472496d235e21decf7289b27ca0a0881807a77fa9d5936daa',
      bytes: 11434478,
    },
    {
      id: 'population-17',
      areaCode: '17000',
      areaName: '石川県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_17_SHP.zip',
      sha256:
        'ccf6535a2f764674121fc6548b422cb11eef4ef6a83008060a94b446e1bdd2db',
      bytes: 9056406,
    },
    {
      id: 'population-18',
      areaCode: '18000',
      areaName: '福井県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_18_SHP.zip',
      sha256:
        '7d82301fe42963b5494dc259aa05e057a0f3814bda23448f5f204c686b6678a5',
      bytes: 7870472,
    },
    {
      id: 'population-19',
      areaCode: '19000',
      areaName: '山梨県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_19_SHP.zip',
      sha256:
        'af07498c3f9febddae04e835436c33f2eba95fe9eb2d32bf908d6f79d18268bd',
      bytes: 8476343,
    },
    {
      id: 'population-20',
      areaCode: '20000',
      areaName: '長野県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_20_SHP.zip',
      sha256:
        'faaab380a807e27321396f9b38b9389d389d1772088b68c8013cca94213ea576',
      bytes: 24248206,
    },
    {
      id: 'population-21',
      areaCode: '21000',
      areaName: '岐阜県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_21_SHP.zip',
      sha256:
        'e1bd81ecbd59a2c238624bdd01730adbfcfed17f377eaafc2b294719534beab1',
      bytes: 19561392,
    },
    {
      id: 'population-22',
      areaCode: '22000',
      areaName: '静岡県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_22_SHP.zip',
      sha256:
        'e8d67e2e8bfd7f8c82b13f9d0af4a412794a6f74c085a03fdedd2e373910c9c5',
      bytes: 25130569,
    },
    {
      id: 'population-23',
      areaCode: '23000',
      areaName: '愛知県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_23_SHP.zip',
      sha256:
        'cea13fb8d05398ee3c145ad92ab910432124cbc87c919e328d3d0832fb8c9d3c',
      bytes: 32830460,
    },
    {
      id: 'population-24',
      areaCode: '24000',
      areaName: '三重県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_24_SHP.zip',
      sha256:
        'cc31560a4f145aaf1095ea70c0c0cd8f0962b6fedb45d57b8f2f7361723758c1',
      bytes: 15721960,
    },
    {
      id: 'population-25',
      areaCode: '25000',
      areaName: '滋賀県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_25_SHP.zip',
      sha256:
        '8e008c12351cf03303fc2c851ad0e5056cce0501e0a7705860e24d16f5609315',
      bytes: 10194307,
    },
    {
      id: 'population-26',
      areaCode: '26000',
      areaName: '京都府',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_26_SHP.zip',
      sha256:
        '12060fa6517042c5de07813f9752f6421b7fdc6933f9642859f6d31ec79fe6bc',
      bytes: 10985353,
    },
    {
      id: 'population-27',
      areaCode: '27000',
      areaName: '大阪府',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_27_SHP.zip',
      sha256:
        '1b4848f83c4cd55bd6043d4c9cd234f063a1d77d3589fc8072b0612bde81bb68',
      bytes: 17229764,
    },
    {
      id: 'population-28',
      areaCode: '28000',
      areaName: '兵庫県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_28_SHP.zip',
      sha256:
        '9c5fdc20bc7fa9a5c7c1b0742f3ac2db303a6e8a53d247a5848808aa440dc794',
      bytes: 26992139,
    },
    {
      id: 'population-29',
      areaCode: '29000',
      areaName: '奈良県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_29_SHP.zip',
      sha256:
        '23b4413347cb8758e8502e1f19de651e51a408c8834b212edacc678d275d498d',
      bytes: 8080326,
    },
    {
      id: 'population-30',
      areaCode: '30000',
      areaName: '和歌山県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_30_SHP.zip',
      sha256:
        '054fa17db739bc5429f30915707f7116be6e788ff09630fb47104b9f893d741b',
      bytes: 8680323,
    },
    {
      id: 'population-31',
      areaCode: '31000',
      areaName: '鳥取県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_31_SHP.zip',
      sha256:
        'da080013f0dc68cff03d3dfee0278ece74f09e76525ea47fb7f5dfc8152695f5',
      bytes: 6032967,
    },
    {
      id: 'population-32',
      areaCode: '32000',
      areaName: '島根県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_32_SHP.zip',
      sha256:
        'aa3bda245a1a2fe27090f291acef3d8c6dade5fd94b6de34e5b2e46531df2f13',
      bytes: 10873784,
    },
    {
      id: 'population-33',
      areaCode: '33000',
      areaName: '岡山県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_33_SHP.zip',
      sha256:
        'fe7e0954eb9ddd3e20031aebab7bae1ab2b2ca144183c6b56dd32ec4432a4c1a',
      bytes: 19179028,
    },
    {
      id: 'population-34',
      areaCode: '34000',
      areaName: '広島県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_34_SHP.zip',
      sha256:
        '3f0c1b623f1f97a323e507ed92329657c71ae9d12c03a6cfe78ac05afe6dfdde',
      bytes: 20129429,
    },
    {
      id: 'population-35',
      areaCode: '35000',
      areaName: '山口県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_35_SHP.zip',
      sha256:
        '49f072ea4733b76b16e90ebda3da5bc5d6f844548e95e9eedb68b839959c51e6',
      bytes: 13270760,
    },
    {
      id: 'population-36',
      areaCode: '36000',
      areaName: '徳島県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_36_SHP.zip',
      sha256:
        '72133a2f368fd236ff19cefa1710fd13df6095dceddcc0bd857112e7f5b8c2ac',
      bytes: 8151120,
    },
    {
      id: 'population-37',
      areaCode: '37000',
      areaName: '香川県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_37_SHP.zip',
      sha256:
        'c91331bf500b8041c1addb5ab16d30e3e8f8dc3daeb95655449c1b4ebcadd428',
      bytes: 9800058,
    },
    {
      id: 'population-38',
      areaCode: '38000',
      areaName: '愛媛県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_38_SHP.zip',
      sha256:
        'b811da7523fc7fef5ca8fbd00991fac33f56b3e018cd59ac3932f22aa13a40f8',
      bytes: 11637179,
    },
    {
      id: 'population-39',
      areaCode: '39000',
      areaName: '高知県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_39_SHP.zip',
      sha256:
        '1e6c9e5ad406be34d50d4c49de3573d29094554229dbd43bc7dfa2d69578dba0',
      bytes: 7854939,
    },
    {
      id: 'population-40',
      areaCode: '40000',
      areaName: '福岡県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_40_SHP.zip',
      sha256:
        '1e1e977e8a9f3ee68f056c6adaaa30a6540437940577f43b696bb64e74c2d57c',
      bytes: 26326160,
    },
    {
      id: 'population-41',
      areaCode: '41000',
      areaName: '佐賀県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_41_SHP.zip',
      sha256:
        '5aa179db546d03b14981625061c19f73fc93955b3c6bb4185f73f7e7ee2a9f1c',
      bytes: 9447566,
    },
    {
      id: 'population-42',
      areaCode: '42000',
      areaName: '長崎県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_42_SHP.zip',
      sha256:
        '0ec683e3f76af2c79338e97cb7a2b93f643bd32b9d4a319bf117e2fab30c8636',
      bytes: 13294019,
    },
    {
      id: 'population-43',
      areaCode: '43000',
      areaName: '熊本県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_43_SHP.zip',
      sha256:
        '323bc078b08668df294923b0970b597779b1f6b75d4b69b098696b026281b8e6',
      bytes: 17779463,
    },
    {
      id: 'population-44',
      areaCode: '44000',
      areaName: '大分県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_44_SHP.zip',
      sha256:
        'a7fb298834cf5e6b40faa1a8e5bf8244d15e96c2e155420df416313b37a65397',
      bytes: 12283578,
    },
    {
      id: 'population-45',
      areaCode: '45000',
      areaName: '宮崎県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_45_SHP.zip',
      sha256:
        '328c42a2c6614263ad1446f72234436a383e317af397b318bf831240f33cc7a1',
      bytes: 12016853,
    },
    {
      id: 'population-46',
      areaCode: '46000',
      areaName: '鹿児島県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_46_SHP.zip',
      sha256:
        '129c521691f18efbed5da557f45213ca242d3ca2c610d060e954c4284d7a495b',
      bytes: 19112070,
    },
    {
      id: 'population-47',
      areaCode: '47000',
      areaName: '沖縄県',
      version: '24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_47_SHP.zip',
      sha256:
        '1defa5f22289368d53488c6d236a6b01f0bf6447ed5b100ac30e36d9e81c866c',
      bytes: 6954183,
    },
  ],
  documentSources: [
    {
      filename: 'snow-code.html',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/codelist/HeavySnowTypeCode.html',
      bytes: 870,
      sha256:
        '24876ce65fb1202fe663859e27d191ff93ec016f8fc3ea82a8559d24d26ea51b',
      fetchedAt: '2026-09-10T15:24:42.342014+00:00',
    },
    {
      filename: 'snow-spec.pdf',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/product_spec/KS-PS-A22-v3_0.pdf',
      bytes: 609175,
      sha256:
        '04ae11dca33e6ba78d009d6e44633e607d1eb86531e8eb09a95c284f82e6010b',
      fetchedAt: '2026-09-10T15:24:42.410840+00:00',
    },
    {
      filename: 'population-index.html',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh250r6.html',
      bytes: 237784,
      sha256:
        '56df77fd42cc00722fa0e9b5e9faf53b6d47a1204500b6a90339fa36837ce6b4',
      fetchedAt: '2026-09-10T15:24:42.504600+00:00',
    },
    {
      filename: 'population-method.pdf',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/r6_about_future_population.pdf',
      bytes: 350965,
      sha256:
        '005d51efd76642d709013fd1d4ef3a4fb47b2ad877e70256a5faf57c4e31a02e',
    },
    {
      filename: 'population-license.html',
      url: 'https://nlftp.mlit.go.jp/ksj/other/agreement_01.html',
      bytes: 62475,
      sha256:
        '260c61a7cde0af334e2e0b9330bc8abc8ca50db7309ef56417b10851eb86eff4',
    },
    {
      filename: 'snow-ksj-v3-index.html',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A22-v3_0.html',
      finalUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A22-v3_0.html',
      sha256:
        'b2083ca11454243431afa14e4da37c6c43fc6bab05178d3159a22f8165d6aee7',
      bytes: 268518,
      fetchedAt: '2026-09-10T14:02:05.828191+00:00',
      role: 'definition-document',
      usedInCalculation: false,
    },
    {
      filename: 'ksj-licence-commercial-legacy.html',
      url: 'https://nlftp.mlit.go.jp/ksj/other/agreement_02.html',
      finalUrl: 'https://nlftp.mlit.go.jp/ksj/other/agreement_02.html',
      sha256:
        '251e6505943556943a925764bb51a4608e7578bca32f90e3ccfbfb6478524893',
      bytes: 62499,
      fetchedAt: '2026-09-10T14:02:05.795291+00:00',
      role: 'license-document',
      usedInCalculation: false,
    },
    {
      filename: 'snow-designations.pdf',
      url: 'https://www.mlit.go.jp/common/001475871.pdf',
      finalUrl: 'https://www.mlit.go.jp/common/001475871.pdf',
      sha256:
        'edca5e61e91a4b124023b5f3b6d8a47b878badff507bad3b881ed0dc15d87246',
      bytes: 974740,
      fetchedAt: '2026-09-10T13:52:09.548959+00:00',
      role: 'context-only',
      usedInCalculation: false,
    },
    {
      filename: 'snow-overview.pdf',
      url: 'https://www.mlit.go.jp/kokudoseisaku/chisei/content/001881217.pdf',
      finalUrl:
        'https://www.mlit.go.jp/kokudoseisaku/chisei/content/001881217.pdf',
      sha256:
        'c4308f5d158b6a94dc14c9526388099372924e6c3afa6b7ea0d0a93c3bc01d62',
      bytes: 3110235,
      fetchedAt: '2026-09-10T13:52:10.081928+00:00',
      role: 'context-only',
      usedInCalculation: false,
    },
  ],
} as const;
