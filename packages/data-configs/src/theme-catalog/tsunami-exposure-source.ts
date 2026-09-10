/** File-specific approved inputs; A40 remains partially licensed globally. */
export const TSUNAMI_EXPOSURE_SOURCE = {
  slug: 'tsunami-scenario-exposure',
  definitionVersion:
    'ksj-licensed-29pref-native-depth_tokushima20250912_m250r6-24_P05-22_v2',
  sectionKey: 'tsunami-scenario-exposure',
  r2Root: 'app/geo/tsunami-scenario-exposure',
  canonicalPath: '/themes/tsunami-exposure#tsunami-scenario-exposure',
  publicationContract: 'licensed-subset-scenario-exposure',
  populationScale: 10000,
  publicBaseUrl: 'https://storage.stats47.jp',
  bands: [
    {
      key: 'd001-03',
      label: '0.01m以上0.3m未満',
    },
    {
      key: 'd03-1',
      label: '0.3m以上1m未満',
    },
    {
      key: 'd1-2',
      label: '1m以上2m未満',
    },
    {
      key: 'd2-3',
      label: '2m以上3m未満',
    },
    {
      key: 'd3-5',
      label: '3m以上5m未満',
    },
    {
      key: 'd5-10',
      label: '5m以上10m未満',
    },
    {
      key: 'd10-20',
      label: '10m以上20m未満',
    },
    {
      key: 'd20plus',
      label: '20m以上',
    },
    {
      key: 'outside-published-inundation',
      label: '採用した原典の浸水区域外',
    },
  ],
  coverage: [
    {
      areaCode: '01000',
      areaName: '北海道',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '02000',
      areaName: '青森県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '03000',
      areaName: '岩手県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '04000',
      areaName: '宮城県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '05000',
      areaName: '秋田県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '06000',
      areaName: '山形県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '07000',
      areaName: '福島県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '08000',
      areaName: '茨城県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '09000',
      areaName: '栃木県',
      status: 'not-in-40-prefecture-reference',
      reason:
        'KSJ 2024年版が示す2024年1月30日時点の40県の浸水想定に含まれません。津波が起こらないと判定したものではありません。',
    },
    {
      areaCode: '10000',
      areaName: '群馬県',
      status: 'not-in-40-prefecture-reference',
      reason:
        'KSJ 2024年版が示す2024年1月30日時点の40県の浸水想定に含まれません。津波が起こらないと判定したものではありません。',
    },
    {
      areaCode: '11000',
      areaName: '埼玉県',
      status: 'not-in-40-prefecture-reference',
      reason:
        'KSJ 2024年版が示す2024年1月30日時点の40県の浸水想定に含まれません。津波が起こらないと判定したものではありません。',
    },
    {
      areaCode: '12000',
      areaName: '千葉県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '13000',
      areaName: '東京都',
      status: 'verified-subset',
      reason:
        '島しょ部11島の固定版です。本土等の未対象と9町村内の未判定を別区分で保持します。',
    },
    {
      areaCode: '14000',
      areaName: '神奈川県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '15000',
      areaName: '新潟県',
      status: 'license-version-conflict',
      reason:
        'A40-17の元年度ページでは提供不可と記載され、現ページの公開表示との整合が未解決のため未使用です。',
    },
    {
      areaCode: '16000',
      areaName: '富山県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '17000',
      areaName: '石川県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '18000',
      areaName: '福井県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '19000',
      areaName: '山梨県',
      status: 'not-in-40-prefecture-reference',
      reason:
        'KSJ 2024年版が示す2024年1月30日時点の40県の浸水想定に含まれません。津波が起こらないと判定したものではありません。',
    },
    {
      areaCode: '20000',
      areaName: '長野県',
      status: 'not-in-40-prefecture-reference',
      reason:
        'KSJ 2024年版が示す2024年1月30日時点の40県の浸水想定に含まれません。津波が起こらないと判定したものではありません。',
    },
    {
      areaCode: '21000',
      areaName: '岐阜県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '22000',
      areaName: '静岡県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '23000',
      areaName: '愛知県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '24000',
      areaName: '三重県',
      status: 'license-conflict',
      reason:
        'A40-16の同梱メタデータに商用利用不可・再配信不可があり、現ページの条件付き公開表示との整合が未解決です。',
    },
    {
      areaCode: '25000',
      areaName: '滋賀県',
      status: 'not-in-40-prefecture-reference',
      reason:
        'KSJ 2024年版が示す2024年1月30日時点の40県の浸水想定に含まれません。津波が起こらないと判定したものではありません。',
    },
    {
      areaCode: '26000',
      areaName: '京都府',
      status: 'prior-contact-required',
      reason:
        '商用利用に事前連絡が必要な原典のため、この集計には使用していません。',
    },
    {
      areaCode: '27000',
      areaName: '大阪府',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '28000',
      areaName: '兵庫県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '29000',
      areaName: '奈良県',
      status: 'not-in-40-prefecture-reference',
      reason:
        'KSJ 2024年版が示す2024年1月30日時点の40県の浸水想定に含まれません。津波が起こらないと判定したものではありません。',
    },
    {
      areaCode: '30000',
      areaName: '和歌山県',
      status: 'license-version-conflict',
      reason:
        'A40-16の元年度ページでは提供不可と記載され、現ページの公開表示との整合が未解決のため未使用です。',
    },
    {
      areaCode: '31000',
      areaName: '鳥取県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '32000',
      areaName: '島根県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '33000',
      areaName: '岡山県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '34000',
      areaName: '広島県',
      status: 'license-conflict',
      reason:
        'A40-16の同梱メタデータに商用利用不可・再配信不可の記載があり未使用です。',
    },
    {
      areaCode: '35000',
      areaName: '山口県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '36000',
      areaName: '徳島県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '37000',
      areaName: '香川県',
      status: 'not-provided-by-ksj',
      reason:
        '浸水想定の対象県ですが、KSJ 2024年版では原典が提供されていません。',
    },
    {
      areaCode: '38000',
      areaName: '愛媛県',
      status: 'license-conflict',
      reason:
        'A40-16の同梱メタデータに商用利用不可・再配信不可の記載があり未使用です。',
    },
    {
      areaCode: '39000',
      areaName: '高知県',
      status: 'license-conflict',
      reason:
        '配布ZIPの商用事前連絡条件と現行一覧の条件が異なるため、利用条件確認中です。',
    },
    {
      areaCode: '40000',
      areaName: '福岡県',
      status: 'license-conflict',
      reason:
        'A40-16の同梱メタデータに商用利用不可・再配信不可の記載があり未使用です。',
    },
    {
      areaCode: '41000',
      areaName: '佐賀県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '42000',
      areaName: '長崎県',
      status: 'prior-contact-required',
      reason:
        '商用利用に事前連絡が必要な原典のため、この集計には使用していません。',
    },
    {
      areaCode: '43000',
      areaName: '熊本県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '44000',
      areaName: '大分県',
      status: 'license-conflict',
      reason:
        'A40-16の同梱メタデータに商用利用不可・再配信不可の記載があり未使用です。',
    },
    {
      areaCode: '45000',
      areaName: '宮崎県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '46000',
      areaName: '鹿児島県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
    {
      areaCode: '47000',
      areaName: '沖縄県',
      status: 'verified-subset',
      reason:
        '固定版の人口・公共施設曝露を検算済みです。県・沿岸ごとの想定条件を確認して利用してください。',
    },
  ],
  inputs: [
    {
      id: 'hazard-22',
      pref: '22',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-16',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-16/A40-16_22_GML.zip',
      sha256:
        '89c1bcfc05021c78193605ca308d46bb48740281168630291319e3f5ef3e8948',
      bytes: 31112016,
      acquiredAt: '2026-09-10T16:02:41.071727+00:00',
      publicKey: 'gis/mlit-ksj/A40/16/22.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted',
      localSourceName: 'A40-16_22_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40.html',
          sha256:
            '3fedd5aed6ad2066bcc26f1a20b9e87a3a1ae2a6241198bedbf09266cd569774',
        },
      ],
    },
    {
      id: 'population-22',
      pref: '22',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_22_SHP.zip',
      sha256:
        'e8d67e2e8bfd7f8c82b13f9d0af4a412794a6f74c085a03fdedd2e373910c9c5',
      bytes: 25130569,
      acquiredAt: '2026-09-10T10:48:54.267Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/22.zip',
      license: 'CC BY 4.0',
      localSourceName: '22.zip',
    },
    {
      id: 'facilities-22',
      pref: '22',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        'fc35fa93b34826c6de93a14e80d03ebcffb81de84c604d8c7d84e7b2e294bd50',
      bytes: 441838,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/22.geojson',
      license: 'CC BY 4.0',
      localSourceName: '22.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-36',
      pref: '36',
      kind: 'hazard',
      provider: 'Tokushima Prefecture',
      version: '2025-09-12',
      url: 'https://opendata.pref.tokushima.lg.jp/dataset/5110/resource/16986/%E6%B4%A5%E6%B3%A2%E6%B5%B8%E6%B0%B4%E6%83%B3%E5%AE%9A%28%E6%B4%A5%E6%B3%A2%E6%B5%B8%E6%B0%B4%E6%B7%B1%29.zip',
      sha256:
        '000409414c07efa911c2229e43b44c97db6977f44d6175037e71db844a018eeb',
      bytes: 12884612,
      acquiredAt: '2026-09-10T16:10:25.435389+00:00',
      publicKey: 'gis/tokushima/tsunami-inundation/2025/36.zip',
      license: 'CC BY (version not stated on dataset page)',
      localSourceName: 'tokushima-2025.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://opendata.pref.tokushima.lg.jp/dataset/5110.html',
          sha256:
            'e93387ea36b8cc7729921716c192127551a6d5f540add450d619ffeacdd2d895',
        },
        {
          url: 'https://opendata.pref.tokushima.lg.jp/kiyaku.html',
          sha256:
            '8ea434a678082861721090aaba534cedcd78b700697134f4b7985e13987f0e0e',
        },
        {
          url: 'https://opendata.pref.tokushima.lg.jp/about.html',
          sha256:
            '7e48661767aa3c7e20a8bb362a1d558632a5ca9fc5aaeed11b0d2c40d2a55bfc',
        },
      ],
    },
    {
      id: 'population-36',
      pref: '36',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_36_SHP.zip',
      sha256:
        '72133a2f368fd236ff19cefa1710fd13df6095dceddcc0bd857112e7f5b8c2ac',
      bytes: 8151120,
      acquiredAt: '2026-09-10T10:49:16.837Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/36.zip',
      license: 'CC BY 4.0',
      localSourceName: '36.zip',
    },
    {
      id: 'facilities-36',
      pref: '36',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '030ccaa69e593b41e148da0be59b73b95ce199dfef27b545b1de69c5f75ddfcc',
      bytes: 305050,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/36.geojson',
      license: 'CC BY 4.0',
      localSourceName: '36.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-01',
      pref: '01',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-23',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-23/A40-23_01_GML.zip',
      sha256:
        'a8296202999fc1586f7d6c61735d91590c10f4e3860bada022a2279e2796175e',
      bytes: 227717844,
      acquiredAt: '2026-09-10T16:36:38.116742+00:00',
      publicKey: 'gis/mlit-ksj/A40/23/01.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-23_01_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
      ],
    },
    {
      id: 'population-01',
      pref: '01',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_01_SHP.zip',
      sha256:
        '9b54d8a4821bb91f642908af1143ac2b626e84bd937af9a3992be5c3d2e946ee',
      bytes: 39461665,
      acquiredAt: '2026-09-10T10:47:52.510Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/01.zip',
      license: 'CC BY 4.0',
      localSourceName: '01.zip',
    },
    {
      id: 'facilities-01',
      pref: '01',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        'ba97e7929caa0d5c11a08ac742e2fec8e8d382cebdd7c080bc3ed96c7427bb01',
      bytes: 1251860,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/01.geojson',
      license: 'CC BY 4.0',
      localSourceName: '01.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-02',
      pref: '02',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-21',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-21/A40-21_02_GML.zip',
      sha256:
        '60fa949397eb96b202c62f8d2604d0be131051e0f654d2e5e865214694796e3a',
      bytes: 54077225,
      acquiredAt: '2026-09-10T16:36:28.528440+00:00',
      publicKey: 'gis/mlit-ksj/A40/21/02.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-21_02_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2023.html',
          sha256:
            'f8ad61816d117f86cb8eb4ecc45752420c903ca35a7248ed4d8d71721dfd3455',
        },
      ],
    },
    {
      id: 'population-02',
      pref: '02',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_02_SHP.zip',
      sha256:
        '1ca9f933aa31c014148c792ff36f2a9dc7d05671ab9833e40c772744b50eb6c0',
      bytes: 13201718,
      acquiredAt: '2026-09-10T10:45:22.416Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/02.zip',
      license: 'CC BY 4.0',
      localSourceName: '02.zip',
    },
    {
      id: 'facilities-02',
      pref: '02',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '14d9df6ef64834bad72f6fb26afb548c5acbc37c60279355da09c6f29efe647e',
      bytes: 452596,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/02.geojson',
      license: 'CC BY 4.0',
      localSourceName: '02.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-03',
      pref: '03',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-22/A40-22_03_GML.zip',
      sha256:
        '85716ded87a5be1e480203debbfd99375bae09f6755d82719a7060d664af0d41',
      bytes: 96454349,
      acquiredAt: '2026-09-10T16:37:05.443808+00:00',
      publicKey: 'gis/mlit-ksj/A40/22/03.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-22_03_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2023.html',
          sha256:
            'f8ad61816d117f86cb8eb4ecc45752420c903ca35a7248ed4d8d71721dfd3455',
        },
      ],
    },
    {
      id: 'population-03',
      pref: '03',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_03_SHP.zip',
      sha256:
        '6d897540dfe0c341d1bf7db422fd1965be065265429a35a5d3510545f6f61af0',
      bytes: 20285723,
      acquiredAt: '2026-09-10T10:47:53.868Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/03.zip',
      license: 'CC BY 4.0',
      localSourceName: '03.zip',
    },
    {
      id: 'facilities-03',
      pref: '03',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '5d50a3648df1ec90366ddde86a4d90ba336cf79ed0f3654c4b2b3276c9218641',
      bytes: 507186,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/03.geojson',
      license: 'CC BY 4.0',
      localSourceName: '03.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-04',
      pref: '04',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-22/A40-22_04_GML.zip',
      sha256:
        '7cc2bccd1df093d3396885d443136249f25ee6b251f2f040f9882ef71b099181',
      bytes: 89111856,
      acquiredAt: '2026-09-10T16:36:53.728568+00:00',
      publicKey: 'gis/mlit-ksj/A40/22/04.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-22_04_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2023.html',
          sha256:
            'f8ad61816d117f86cb8eb4ecc45752420c903ca35a7248ed4d8d71721dfd3455',
        },
        {
          url: 'https://www.pref.miyagi.jp/site/opendata-miyagi/kokudo-kisho.html',
          sha256:
            '4a9cd62431abd613bc0022c7e7b4abcb273cb4c0597b5e1b464324a9f0beb6f4',
        },
        {
          url: 'https://miyagi.dataeye.jp/pages/terms',
          sha256:
            '56a2e55cb69f7499f9c381fd1d9224d4430ef7527f502ac9b05d621d3a1e7a2d',
        },
      ],
    },
    {
      id: 'population-04',
      pref: '04',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_04_SHP.zip',
      sha256:
        'c752ad70f643d8fa16bc8bcc2b5f54fef7028d2d3e69ca3ece37501594e7d285',
      bytes: 19915373,
      acquiredAt: '2026-09-10T10:47:58.867Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/04.zip',
      license: 'CC BY 4.0',
      localSourceName: '04.zip',
    },
    {
      id: 'facilities-04',
      pref: '04',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '569056021cf2addbe212eaebb618a7d8e9d5e9fa09334b9704100654ec0808fd',
      bytes: 471423,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/04.geojson',
      license: 'CC BY 4.0',
      localSourceName: '04.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-05',
      pref: '05',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-16',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-16/A40-16_05_GML.zip',
      sha256:
        '5a9d4c9eeda6a6c30ace50902f590879e2c50a8e8c0e820eef37744fcd114620',
      bytes: 40822581,
      acquiredAt: '2026-09-10T16:37:04.052732+00:00',
      publicKey: 'gis/mlit-ksj/A40/16/05.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-16_05_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40.html',
          sha256:
            '3fedd5aed6ad2066bcc26f1a20b9e87a3a1ae2a6241198bedbf09266cd569774',
        },
      ],
    },
    {
      id: 'population-05',
      pref: '05',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_05_SHP.zip',
      sha256:
        '24858b16e383ae988c98c08dd68bae8c4648e7352437c2325dce7e7d2f10ba91',
      bytes: 13148078,
      acquiredAt: '2026-09-10T10:48:00.143Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/05.zip',
      license: 'CC BY 4.0',
      localSourceName: '05.zip',
    },
    {
      id: 'facilities-05',
      pref: '05',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '0b7966c25ba8b83a686b89328f12cb1cb2e19463b5e2768125e2cb24f0a4c864',
      bytes: 354618,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/05.geojson',
      license: 'CC BY 4.0',
      localSourceName: '05.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-06',
      pref: '06',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-16',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-16/A40-16_06_GML.zip',
      sha256:
        'd6065a32133229294b3e308237f3fb91c45dc543436a1a2b373c811838467067',
      bytes: 7182464,
      acquiredAt: '2026-09-10T16:36:56.749882+00:00',
      publicKey: 'gis/mlit-ksj/A40/16/06.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-16_06_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40.html',
          sha256:
            '3fedd5aed6ad2066bcc26f1a20b9e87a3a1ae2a6241198bedbf09266cd569774',
        },
      ],
    },
    {
      id: 'population-06',
      pref: '06',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_06_SHP.zip',
      sha256:
        '2b7a751cc3901292b65cea7f678d4ca61339a09bbf5c20f817b0bdc5f0ee4eca',
      bytes: 12383953,
      acquiredAt: '2026-09-10T10:48:05.984Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/06.zip',
      license: 'CC BY 4.0',
      localSourceName: '06.zip',
    },
    {
      id: 'facilities-06',
      pref: '06',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '48703e713531b58f01ac0e8c558955520dd01a69cd83d287883aa46de711cf5d',
      bytes: 298300,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/06.geojson',
      license: 'CC BY 4.0',
      localSourceName: '06.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-07',
      pref: '07',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-23',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-23/A40-23_07_GML.zip',
      sha256:
        'f7d95f1db6588e27d65986d112ac215f667e7e104cae89e6e4087ea920c6280d',
      bytes: 27164086,
      acquiredAt: '2026-09-10T16:37:07.133310+00:00',
      publicKey: 'gis/mlit-ksj/A40/23/07.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-23_07_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
      ],
    },
    {
      id: 'population-07',
      pref: '07',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_07_SHP.zip',
      sha256:
        'd2c6ea67a7ef1eeb411fae338f32731e6908405fa87f5b942fcef9c393c1090e',
      bytes: 24186647,
      acquiredAt: '2026-09-10T10:48:08.890Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/07.zip',
      license: 'CC BY 4.0',
      localSourceName: '07.zip',
    },
    {
      id: 'facilities-07',
      pref: '07',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '6ac3d90b7bc5638d1dba2dafa25f2157c1968af56d3e66ecbb5ff7a2817bca5c',
      bytes: 612693,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/07.geojson',
      license: 'CC BY 4.0',
      localSourceName: '07.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-08',
      pref: '08',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-23',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-23/A40-23_08_GML.zip',
      sha256:
        '31006181112dfc7e27c1b4e9e980d6a75cade47b4597fed87cf91d9002402189',
      bytes: 35959074,
      acquiredAt: '2026-09-10T16:37:15.508323+00:00',
      publicKey: 'gis/mlit-ksj/A40/23/08.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-23_08_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
      ],
    },
    {
      id: 'population-08',
      pref: '08',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_08_SHP.zip',
      sha256:
        '4bf8103cfa4a2feed99ce69aa69959bc23440abf162fd369b2673830beeae57d',
      bytes: 33353372,
      acquiredAt: '2026-09-10T10:48:18.549Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/08.zip',
      license: 'CC BY 4.0',
      localSourceName: '08.zip',
    },
    {
      id: 'facilities-08',
      pref: '08',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        'f368bbf32c3c047e79510387814593bc35b03befe409adc064124ecd5f5a0e24',
      bytes: 462148,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/08.geojson',
      license: 'CC BY 4.0',
      localSourceName: '08.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-12',
      pref: '12',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-18',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-18/A40-18_12_GML.zip',
      sha256:
        'becf21ab28d686cef622e3b26cf56b6782c6fb868dc0ca98d38e7bdb6875689b',
      bytes: 70755828,
      acquiredAt: '2026-09-10T16:37:26.547601+00:00',
      publicKey: 'gis/mlit-ksj/A40/18/12.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-18_12_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2018.html',
          sha256:
            'c6202d2b01f4c55ce5c063d79d7f03f6613ad8d24b34eda87ae51ad48bca5585',
        },
        {
          url: 'https://www.pref.chiba.lg.jp/kendosei/documents/tunami-kaisetusho.pdf',
          sha256:
            '5ba33479e6049891068c2d662e6a7956d9d926b149f0ea50b6909f4bb6b35857',
        },
      ],
    },
    {
      id: 'population-12',
      pref: '12',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_12_SHP.zip',
      sha256:
        'd6ab429091435c8d98a2f74d8f3c5bafad06c10c5fcff04497e7e4dc4e4570ed',
      bytes: 33058979,
      acquiredAt: '2026-09-10T10:48:28.310Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/12.zip',
      license: 'CC BY 4.0',
      localSourceName: '12.zip',
    },
    {
      id: 'facilities-12',
      pref: '12',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '065a5fdbeb8b8e630b8f3a200ffb63c2b7018cba16c6ed184841e714f1dcbbab',
      bytes: 399908,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/12.geojson',
      license: 'CC BY 4.0',
      localSourceName: '12.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-13',
      pref: '13',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-23',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-23/A40-23_13_GML.zip',
      sha256:
        'b8e24973e5f9b885d481c28211f107587d14597cb3d9674d26c1aa591dacdc5c',
      bytes: 8710803,
      acquiredAt: '2026-09-10T16:37:17.047227+00:00',
      publicKey: 'gis/mlit-ksj/A40/23/13.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-23_13_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
      ],
    },
    {
      id: 'population-13',
      pref: '13',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_13_SHP.zip',
      sha256:
        'ce5f07f1e1164a1ef7e3803a527f78712a9f63f0a61e31bb87e2ff6185711d3d',
      bytes: 19638063,
      acquiredAt: '2026-09-10T10:48:28.125Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/13.zip',
      license: 'CC BY 4.0',
      localSourceName: '13.zip',
    },
    {
      id: 'facilities-13',
      pref: '13',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        'df3bdefc71b1d9e22cdfe90405374f022fe7637ec0460c5b3995cbc276d46156',
      bytes: 734745,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/13.geojson',
      license: 'CC BY 4.0',
      localSourceName: '13.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-14',
      pref: '14',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-20',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-20/A40-20_14_GML.zip',
      sha256:
        '6b3192e4ed4f8f28d057e4738ecc0d2e7bef232d6adc3022f2d6aec8375f7479',
      bytes: 29821436,
      acquiredAt: '2026-09-10T16:37:27.604517+00:00',
      publicKey: 'gis/mlit-ksj/A40/20/14.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-20_14_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2020.html',
          sha256:
            '756acfbcabfb0b6ddbd23d1b6f692a70c8df6af34ac1a40e6a421c0530be0ca9',
        },
      ],
    },
    {
      id: 'population-14',
      pref: '14',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_14_SHP.zip',
      sha256:
        'a74b68266a6d48c1bb83f08bd8affd2d77125d552af31c3dd62073d0964bb413',
      bytes: 20804106,
      acquiredAt: '2026-09-10T10:48:33.132Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/14.zip',
      license: 'CC BY 4.0',
      localSourceName: '14.zip',
    },
    {
      id: 'facilities-14',
      pref: '14',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        'ab095dfee10f03b5f462910fef519f730f56f81faab4254a00f6e04b42c2d122',
      bytes: 390751,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/14.geojson',
      license: 'CC BY 4.0',
      localSourceName: '14.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-16',
      pref: '16',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-20',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-20/A40-20_16_GML.zip',
      sha256:
        '7e8adf12310f86bc46400b167b46e9793bd59884089bf63ff8c7f806d96cea87',
      bytes: 7142502,
      acquiredAt: '2026-09-10T16:37:31.054345+00:00',
      publicKey: 'gis/mlit-ksj/A40/20/16.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-20_16_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2020.html',
          sha256:
            '756acfbcabfb0b6ddbd23d1b6f692a70c8df6af34ac1a40e6a421c0530be0ca9',
        },
      ],
    },
    {
      id: 'population-16',
      pref: '16',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_16_SHP.zip',
      sha256:
        '91f07b687d56602472496d235e21decf7289b27ca0a0881807a77fa9d5936daa',
      bytes: 11434478,
      acquiredAt: '2026-09-10T10:48:36.973Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/16.zip',
      license: 'CC BY 4.0',
      localSourceName: '16.zip',
    },
    {
      id: 'facilities-16',
      pref: '16',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        'e0de76b6d05dd266431b777dc56c2b52a2d445bd3edb0f857ce20b0f375d9425',
      bytes: 188965,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/16.geojson',
      license: 'CC BY 4.0',
      localSourceName: '16.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-17',
      pref: '17',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-17',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-17/A40-17_17_GML.zip',
      sha256:
        '6fe7adc87649dddad7c87ebab1e43354a79f2e2992b695104931f35cf68264d1',
      bytes: 16974889,
      acquiredAt: '2026-09-10T16:37:33.534839+00:00',
      publicKey: 'gis/mlit-ksj/A40/17/17.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-17_17_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2018.html',
          sha256:
            'c6202d2b01f4c55ce5c063d79d7f03f6613ad8d24b34eda87ae51ad48bca5585',
        },
      ],
    },
    {
      id: 'population-17',
      pref: '17',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_17_SHP.zip',
      sha256:
        'ccf6535a2f764674121fc6548b422cb11eef4ef6a83008060a94b446e1bdd2db',
      bytes: 9056406,
      acquiredAt: '2026-09-10T10:48:37.084Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/17.zip',
      license: 'CC BY 4.0',
      localSourceName: '17.zip',
    },
    {
      id: 'facilities-17',
      pref: '17',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '63d39a94b9f136055f47a2cc0d62aca99fdfaa9aa53c16778ea50a187d9e05c3',
      bytes: 242752,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/17.geojson',
      license: 'CC BY 4.0',
      localSourceName: '17.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-18',
      pref: '18',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-23',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-23/A40-23_18_GML.zip',
      sha256:
        '9c00bf0344e3b5c8ef4b7ef534e019335a3cd9d8ba531813b97f9405a004c13c',
      bytes: 5018171,
      acquiredAt: '2026-09-10T16:37:38.081020+00:00',
      publicKey: 'gis/mlit-ksj/A40/23/18.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-23_18_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
      ],
    },
    {
      id: 'population-18',
      pref: '18',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_18_SHP.zip',
      sha256:
        '7d82301fe42963b5494dc259aa05e057a0f3814bda23448f5f204c686b6678a5',
      bytes: 7870472,
      acquiredAt: '2026-09-10T10:48:39.133Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/18.zip',
      license: 'CC BY 4.0',
      localSourceName: '18.zip',
    },
    {
      id: 'facilities-18',
      pref: '18',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        'c4e339447009ad49b62e6136b0238ea2b354077ffc373d588e4d26017fd596a2',
      bytes: 155406,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/18.geojson',
      license: 'CC BY 4.0',
      localSourceName: '18.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-21',
      pref: '21',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-23',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-23/A40-23_21_GML.zip',
      sha256:
        '1be18b3ef034b26ff66252da2c79c30bb21e4984fb6a1edec3734d84214f58af',
      bytes: 1872220,
      acquiredAt: '2026-09-10T16:37:38.404360+00:00',
      publicKey: 'gis/mlit-ksj/A40/23/21.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-23_21_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
      ],
    },
    {
      id: 'population-21',
      pref: '21',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_21_SHP.zip',
      sha256:
        'e1bd81ecbd59a2c238624bdd01730adbfcfed17f377eaafc2b294719534beab1',
      bytes: 19561392,
      acquiredAt: '2026-09-10T10:48:44.902Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/21.zip',
      license: 'CC BY 4.0',
      localSourceName: '21.zip',
    },
    {
      id: 'facilities-21',
      pref: '21',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '7b6ee3a9945fa0e18b28cb28b20fedfc8c89fbf98dfeac02ae576d1725ad275a',
      bytes: 354761,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/21.geojson',
      license: 'CC BY 4.0',
      localSourceName: '21.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-23',
      pref: '23',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-22/A40-22_23_GML.zip',
      sha256:
        '06c334eaa9c779222f4647457fe727b7264f8adec31cdf200024cee9d0aa7573',
      bytes: 88937846,
      acquiredAt: '2026-09-10T16:37:55.660312+00:00',
      publicKey: 'gis/mlit-ksj/A40/22/23.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-22_23_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2023.html',
          sha256:
            'f8ad61816d117f86cb8eb4ecc45752420c903ca35a7248ed4d8d71721dfd3455',
        },
      ],
    },
    {
      id: 'population-23',
      pref: '23',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_23_SHP.zip',
      sha256:
        'cea13fb8d05398ee3c145ad92ab910432124cbc87c919e328d3d0832fb8c9d3c',
      bytes: 32830460,
      acquiredAt: '2026-09-10T10:48:52.542Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/23.zip',
      license: 'CC BY 4.0',
      localSourceName: '23.zip',
    },
    {
      id: 'facilities-23',
      pref: '23',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '9ef9d45417b051bb52484063c8a1e702754e4fa95694846d8262f55cdc6810f1',
      bytes: 587593,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/23.geojson',
      license: 'CC BY 4.0',
      localSourceName: '23.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-27',
      pref: '27',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-23',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-23/A40-23_27_GML.zip',
      sha256:
        'e1dc7aa65a020a53fec8ccabe9e5d1c2e7ec86e29174c4a69822e48207b2582b',
      bytes: 25681050,
      acquiredAt: '2026-09-10T16:37:51.893288+00:00',
      publicKey: 'gis/mlit-ksj/A40/23/27.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-23_27_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
      ],
    },
    {
      id: 'population-27',
      pref: '27',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_27_SHP.zip',
      sha256:
        '1b4848f83c4cd55bd6043d4c9cd234f063a1d77d3589fc8072b0612bde81bb68',
      bytes: 17229764,
      acquiredAt: '2026-09-10T10:49:01.804Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/27.zip',
      license: 'CC BY 4.0',
      localSourceName: '27.zip',
    },
    {
      id: 'facilities-27',
      pref: '27',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '276e2318e0251700f1f37c3e44a97dd06f96bc22eb71c8601a46bf284ca74962',
      bytes: 514276,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/27.geojson',
      license: 'CC BY 4.0',
      localSourceName: '27.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-28-16',
      pref: '28',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-16',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-16/A40-16_28_GML.zip',
      sha256:
        '37974f4ae2dcdad7b71b456e036cd26e63099b6a451912684cef6eb8b4b410f2',
      bytes: 15177977,
      acquiredAt: '2026-09-10T16:38:00.458943+00:00',
      publicKey: 'gis/mlit-ksj/A40/16/28.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-16_28_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40.html',
          sha256:
            '3fedd5aed6ad2066bcc26f1a20b9e87a3a1ae2a6241198bedbf09266cd569774',
        },
        {
          url: 'https://web.pref.hyogo.lg.jp/kk26/johoseisaku/documents/kiyaku_opendata.pdf',
          sha256:
            'f5964f9da77b12593ca5824a1e5d8e7770e02d8c3dc8c030496ff2210f8ad7e8',
        },
      ],
    },
    {
      id: 'hazard-28-18',
      pref: '28',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-18',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-18/A40-18_28_GML.zip',
      sha256:
        '6e9505c93d09153ca4cc02cfa5fa85a2a9987261c52b38c54b319f43682ba5f0',
      bytes: 2635049,
      acquiredAt: '2026-09-10T16:37:57.217474+00:00',
      publicKey: 'gis/mlit-ksj/A40/18/28.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-18_28_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2018.html',
          sha256:
            'c6202d2b01f4c55ce5c063d79d7f03f6613ad8d24b34eda87ae51ad48bca5585',
        },
        {
          url: 'https://web.pref.hyogo.lg.jp/kk26/johoseisaku/documents/kiyaku_opendata.pdf',
          sha256:
            'f5964f9da77b12593ca5824a1e5d8e7770e02d8c3dc8c030496ff2210f8ad7e8',
        },
      ],
    },
    {
      id: 'population-28',
      pref: '28',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_28_SHP.zip',
      sha256:
        '9c5fdc20bc7fa9a5c7c1b0742f3ac2db303a6e8a53d247a5848808aa440dc794',
      bytes: 26992139,
      acquiredAt: '2026-09-10T10:49:06.280Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/28.zip',
      license: 'CC BY 4.0',
      localSourceName: '28.zip',
    },
    {
      id: 'facilities-28',
      pref: '28',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '1c40faee88e0284d875c640345dbf80f3580010517c40679dccc5aade00ff614',
      bytes: 576136,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/28.geojson',
      license: 'CC BY 4.0',
      localSourceName: '28.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-31',
      pref: '31',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-18',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-18/A40-18_31_GML.zip',
      sha256:
        '25b7bd6136d989456e580ec88ce84070ca817f8c19c67a78860d0fc5898f3607',
      bytes: 7239496,
      acquiredAt: '2026-09-10T16:38:02.790104+00:00',
      publicKey: 'gis/mlit-ksj/A40/18/31.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-18_31_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2018.html',
          sha256:
            'c6202d2b01f4c55ce5c063d79d7f03f6613ad8d24b34eda87ae51ad48bca5585',
        },
      ],
    },
    {
      id: 'population-31',
      pref: '31',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_31_SHP.zip',
      sha256:
        'da080013f0dc68cff03d3dfee0278ece74f09e76525ea47fb7f5dfc8152695f5',
      bytes: 6032967,
      acquiredAt: '2026-09-10T10:49:07.874Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/31.zip',
      license: 'CC BY 4.0',
      localSourceName: '31.zip',
    },
    {
      id: 'facilities-31',
      pref: '31',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '1544df202989f7f517b8be312fdf2b09ae6d443c4c92678590bebefa773a71ac',
      bytes: 189174,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/31.geojson',
      license: 'CC BY 4.0',
      localSourceName: '31.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-32',
      pref: '32',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-24/A40-24_32_GML.zip',
      sha256:
        'c97e6dc6a4ccad9fd5d44f8c023c442e453e26329b3ac2e00838188516813a34',
      bytes: 10298530,
      acquiredAt: '2026-09-10T16:38:08.172499+00:00',
      publicKey: 'gis/mlit-ksj/A40/24/32.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-24_32_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://shimane-opendata.jp/pages/terms',
          sha256:
            '69210d68b488bb783bdd558d0c45f0ded7cf4cb5cf462d5da62df05c1c13a8d7',
        },
      ],
    },
    {
      id: 'population-32',
      pref: '32',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_32_SHP.zip',
      sha256:
        'aa3bda245a1a2fe27090f291acef3d8c6dade5fd94b6de34e5b2e46531df2f13',
      bytes: 10873784,
      acquiredAt: '2026-09-10T10:49:08.606Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/32.zip',
      license: 'CC BY 4.0',
      localSourceName: '32.zip',
    },
    {
      id: 'facilities-32',
      pref: '32',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '50679fe0ffdf091951551dd2f09406ba80ec27ac3be12bbbd2c961e8421a3536',
      bytes: 315744,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/32.geojson',
      license: 'CC BY 4.0',
      localSourceName: '32.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-33',
      pref: '33',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-22/A40-22_33_GML.zip',
      sha256:
        '6bc84db1f048a2dc49f1038baf64e1181350d46b0b60f497420715be9345338d',
      bytes: 38575316,
      acquiredAt: '2026-09-10T16:38:18.607577+00:00',
      publicKey: 'gis/mlit-ksj/A40/22/33.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-22_33_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2023.html',
          sha256:
            'f8ad61816d117f86cb8eb4ecc45752420c903ca35a7248ed4d8d71721dfd3455',
        },
      ],
    },
    {
      id: 'population-33',
      pref: '33',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_33_SHP.zip',
      sha256:
        'fe7e0954eb9ddd3e20031aebab7bae1ab2b2ca144183c6b56dd32ec4432a4c1a',
      bytes: 19179028,
      acquiredAt: '2026-09-10T10:49:14.273Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/33.zip',
      license: 'CC BY 4.0',
      localSourceName: '33.zip',
    },
    {
      id: 'facilities-33',
      pref: '33',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        'a4166a8f415f61679269896aaf61604f51c6f050ac06c2b46de05c80ca640626',
      bytes: 462447,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/33.geojson',
      license: 'CC BY 4.0',
      localSourceName: '33.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-35',
      pref: '35',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-16',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-16/A40-16_35_GML.zip',
      sha256:
        'e9ff6e294782f318de6f3dcd0a21d02d8aacda0413f70f4c69c601cd1960de3b',
      bytes: 35876579,
      acquiredAt: '2026-09-10T16:38:24.804188+00:00',
      publicKey: 'gis/mlit-ksj/A40/16/35.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-16_35_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40.html',
          sha256:
            '3fedd5aed6ad2066bcc26f1a20b9e87a3a1ae2a6241198bedbf09266cd569774',
        },
      ],
    },
    {
      id: 'population-35',
      pref: '35',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_35_SHP.zip',
      sha256:
        '49f072ea4733b76b16e90ebda3da5bc5d6f844548e95e9eedb68b839959c51e6',
      bytes: 13270760,
      acquiredAt: '2026-09-10T10:49:16.214Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/35.zip',
      license: 'CC BY 4.0',
      localSourceName: '35.zip',
    },
    {
      id: 'facilities-35',
      pref: '35',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        'd34c8f6c580bc25e122b8fff57ba8594b85d347c12614ae4943136e1d11ff171',
      bytes: 290129,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/35.geojson',
      license: 'CC BY 4.0',
      localSourceName: '35.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-41',
      pref: '41',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-16',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-16/A40-16_41_GML.zip',
      sha256:
        '4ccb8fdbc6e79012bf96022eee84012bbac03f8bb5b3ab73a478868ebe8aed17',
      bytes: 29349275,
      acquiredAt: '2026-09-10T16:38:33.556129+00:00',
      publicKey: 'gis/mlit-ksj/A40/16/41.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-16_41_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40.html',
          sha256:
            '3fedd5aed6ad2066bcc26f1a20b9e87a3a1ae2a6241198bedbf09266cd569774',
        },
      ],
    },
    {
      id: 'population-41',
      pref: '41',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_41_SHP.zip',
      sha256:
        '5aa179db546d03b14981625061c19f73fc93955b3c6bb4185f73f7e7ee2a9f1c',
      bytes: 9447566,
      acquiredAt: '2026-09-10T10:49:21.932Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/41.zip',
      license: 'CC BY 4.0',
      localSourceName: '41.zip',
    },
    {
      id: 'facilities-41',
      pref: '41',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '5422b7de9f991e509b8ecedd41df133a6c6786d251f61619d740faeb6ac14dad',
      bytes: 149961,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/41.geojson',
      license: 'CC BY 4.0',
      localSourceName: '41.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-43',
      pref: '43',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-22/A40-22_43_GML.zip',
      sha256:
        '4c2f7ee4bbf8842440ccea3efebdcf25fea20453c4682f51d9368fe4105e490a',
      bytes: 28200997,
      acquiredAt: '2026-09-10T16:38:33.587622+00:00',
      publicKey: 'gis/mlit-ksj/A40/22/43.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-22_43_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2023.html',
          sha256:
            'f8ad61816d117f86cb8eb4ecc45752420c903ca35a7248ed4d8d71721dfd3455',
        },
      ],
    },
    {
      id: 'population-43',
      pref: '43',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_43_SHP.zip',
      sha256:
        '323bc078b08668df294923b0970b597779b1f6b75d4b69b098696b026281b8e6',
      bytes: 17779463,
      acquiredAt: '2026-09-10T10:49:29.674Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/43.zip',
      license: 'CC BY 4.0',
      localSourceName: '43.zip',
    },
    {
      id: 'facilities-43',
      pref: '43',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '7a0e3f9b687670b11f3c0bf27c9fc793a9d189749f43f12c11e9d4754c0e6b61',
      bytes: 392345,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/43.geojson',
      license: 'CC BY 4.0',
      localSourceName: '43.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-45',
      pref: '45',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-23',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-23/A40-23_45_GML.zip',
      sha256:
        '67f1a051942c904b6c20f8136c38ad64d02854d04dbc1e92d86f3ea7d203fa9c',
      bytes: 34169169,
      acquiredAt: '2026-09-10T16:38:41.213160+00:00',
      publicKey: 'gis/mlit-ksj/A40/23/45.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-23_45_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
      ],
    },
    {
      id: 'population-45',
      pref: '45',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_45_SHP.zip',
      sha256:
        '328c42a2c6614263ad1446f72234436a383e317af397b318bf831240f33cc7a1',
      bytes: 12016853,
      acquiredAt: '2026-09-10T10:49:32.582Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/45.zip',
      license: 'CC BY 4.0',
      localSourceName: '45.zip',
    },
    {
      id: 'facilities-45',
      pref: '45',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '7de348224a74fc25d96c1b91f18c9b136043180355699ef23fff6acd97bfeb9c',
      bytes: 219504,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/45.geojson',
      license: 'CC BY 4.0',
      localSourceName: '45.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-46',
      pref: '46',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-20',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-20/A40-20_46_GML.zip',
      sha256:
        '52c5e9afdf8755328ea6d207297863a50d69b0a87f65723b0d67ee86a4d3c01e',
      bytes: 53151449,
      acquiredAt: '2026-09-10T16:38:52.850037+00:00',
      publicKey: 'gis/mlit-ksj/A40/20/46.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-20_46_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2020.html',
          sha256:
            '756acfbcabfb0b6ddbd23d1b6f692a70c8df6af34ac1a40e6a421c0530be0ca9',
        },
      ],
    },
    {
      id: 'population-46',
      pref: '46',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_46_SHP.zip',
      sha256:
        '129c521691f18efbed5da557f45213ca242d3ca2c610d060e954c4284d7a495b',
      bytes: 19112070,
      acquiredAt: '2026-09-10T10:49:34.163Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/46.zip',
      license: 'CC BY 4.0',
      localSourceName: '46.zip',
    },
    {
      id: 'facilities-46',
      pref: '46',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        'daf0dfa283d101d9ec5673e96d6d6c26c0d8195b6139967118180fecbf96e1d9',
      bytes: 346922,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/46.geojson',
      license: 'CC BY 4.0',
      localSourceName: '46.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
    {
      id: 'hazard-47',
      pref: '47',
      kind: 'hazard',
      provider: 'MLIT KSJ',
      version: 'A40-16',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-16/A40-16_47_GML.zip',
      sha256:
        'cc2ede6d634507f1f71e0ef99e9447e305b580cc5b776974c70c91858029ee2c',
      bytes: 39726266,
      acquiredAt: '2026-09-10T16:38:56.472667+00:00',
      publicKey: 'gis/mlit-ksj/A40/16/47.zip',
      license:
        'KSJ file-specific open data: commercial use and redistribution permitted; prefectural terms and attribution retained',
      localSourceName: 'A40-16_47_GML.zip',
      redistributionAllowed: true,
      licenseEvidence: [
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
          sha256:
            '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
        },
        {
          url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40.html',
          sha256:
            '3fedd5aed6ad2066bcc26f1a20b9e87a3a1ae2a6241198bedbf09266cd569774',
        },
      ],
    },
    {
      id: 'population-47',
      pref: '47',
      kind: 'population',
      provider: 'MLIT KSJ',
      version: 'm250r6-24',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/m250r6/m250r6-24/250m_mesh_2024_47_SHP.zip',
      sha256:
        '1defa5f22289368d53488c6d236a6b01f0bf6447ed5b100ac30e36d9e81c866c',
      bytes: 6954183,
      acquiredAt: '2026-09-10T10:49:34.668Z',
      publicKey: 'gis/mlit-ksj/m250r6/24/47.zip',
      license: 'CC BY 4.0',
      localSourceName: '47.zip',
    },
    {
      id: 'facilities-47',
      pref: '47',
      kind: 'facilities',
      provider: 'MLIT KSJ',
      version: 'P05-22',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/data/P05/P05-22/P05-22_GML.zip',
      sha256:
        '358cab1d04ad6ef4693f443274245c13a33bd26d9f9520f65100068f23a1c8e9',
      bytes: 222776,
      acquiredAt: null,
      publicKey: 'gis/mlit-ksj/P05/22/47.geojson',
      license: 'CC BY 4.0',
      localSourceName: '47.geojson',
      archiveSha256:
        '3056d3e0d02248143f1f2c9a5e62fd37717eb761a7257106b5d252415aef4cdc',
    },
  ],
  evidence: [
    {
      name: 'ksj-a40-2024.html',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      sha256:
        '80232eb2dcf0e2a019b8070156c06eca3c63e6572df875e0a0a7ceb12153372f',
      bytes: 101876,
      retrievedAt: '2026-09-10T15:59:49.906091+00:00',
    },
    {
      name: 'ksj-a40-v11.html',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40.html',
      sha256:
        '3fedd5aed6ad2066bcc26f1a20b9e87a3a1ae2a6241198bedbf09266cd569774',
      bytes: 60261,
      retrievedAt: '2026-09-10T16:02:41.264667+00:00',
    },
    {
      name: 'tokushima-2025-dataset.html',
      url: 'https://opendata.pref.tokushima.lg.jp/dataset/5110.html',
      sha256:
        'e93387ea36b8cc7729921716c192127551a6d5f540add450d619ffeacdd2d895',
      bytes: 19422,
      retrievedAt: '2026-09-10T16:10:23.040595+00:00',
    },
    {
      name: 'tokushima-terms.html',
      url: 'https://opendata.pref.tokushima.lg.jp/kiyaku.html',
      sha256:
        '8ea434a678082861721090aaba534cedcd78b700697134f4b7985e13987f0e0e',
      bytes: 30998,
      retrievedAt: '2026-09-10T16:10:23.043586+00:00',
    },
    {
      name: 'tokushima-about.html',
      url: 'https://opendata.pref.tokushima.lg.jp/about.html',
      sha256:
        '7e48661767aa3c7e20a8bb362a1d558632a5ca9fc5aaeed11b0d2c40d2a55bfc',
      bytes: 17296,
      retrievedAt: '2026-09-10T16:10:23.107577+00:00',
    },
    {
      name: 'shizuoka-level2-envelope.pdf',
      url: 'https://www.pref.shizuoka.jp/_res/projects/default_project/_page_/001/029/868/saidaisinnsuiikizu-01.pdf',
      sha256:
        '5e61505b30a59a59f25b0668296a2e76b14e4328c14bafef2ca47c71c1b37152',
      bytes: 8271685,
      retrievedAt: '2026-09-10T16:02:49.396895+00:00',
    },
    {
      name: 'tokushima-2025-scenario.pdf',
      url: 'https://www.pref.tokushima.lg.jp/file/attachment/1014560.pdf',
      sha256:
        '034a48f37a7e6f31d62e44b1bc32efd303c2e7e37f131c8b805813ec28b5c45f',
      bytes: 2711701,
      retrievedAt: '2026-09-10T16:10:25.480850+00:00',
    },
    {
      name: 'aichi-minister-report.pdf',
      url: 'https://www.mlit.go.jp/river/shinngikai_blog/shaseishin/kasenbunkakai/bunkakai/dai51kai/siryou3-4.pdf',
      sha256:
        'd17f9bd0cd0e2b061d6b257c1bb5d6a73c22a7ce7dd2e5244611b1c0318fb503',
      bytes: 54051948,
      retrievedAt: '2026-09-10T17:09:09.139050+00:00',
    },
    {
      name: 'akita-scenarios.pdf',
      url: 'https://www.pref.akita.lg.jp/uploads/public/archive_0000053908_00/%E6%B4%A5%E6%B3%A2%E6%B5%B8%E6%B0%B4%E6%83%B3%E5%AE%9A%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%EF%BC%88%E8%A7%A3%E8%AA%AC%EF%BC%89.pdf',
      sha256:
        'b15624b759209be6880693b5323d6558f8051b7ab38cb5067dfc5b82f9a4c0ed',
      bytes: 1777620,
      retrievedAt: '2026-09-10T16:58:20.750928+00:00',
    },
    {
      name: 'aomori-scenarios.pdf',
      url: 'https://www.pref.aomori.lg.jp/soshiki/kendo/kasensabo/files/01_tsunami_kaisetsu20220428.pdf',
      sha256:
        'b0a932c8f39d925cffcdbae0f10753ae5fcf28483970f4213beee14b95a235c2',
      bytes: 3274968,
      retrievedAt: '2026-09-10T16:42:51.857076+00:00',
    },
    {
      name: 'chiba-scenarios.html',
      url: 'https://www.pref.chiba.lg.jp/kendosei/tsunami-shinsuisoutei.html',
      sha256:
        '704f863e31d31fe37a4940ae1941be3a4e2b2f3a58ff55e0ecaf5de50797e010',
      bytes: 38350,
      retrievedAt: '2026-09-10T16:59:41.803740+00:00',
    },
    {
      name: 'chiba-scenarios.pdf',
      url: 'https://www.pref.chiba.lg.jp/kendosei/documents/tunami-kaisetusho.pdf',
      sha256:
        '5ba33479e6049891068c2d662e6a7956d9d926b149f0ea50b6909f4bb6b35857',
      bytes: 3813290,
      retrievedAt: '2026-09-10T17:00:55.260584+00:00',
    },
    {
      name: 'fukui-scenarios.pdf',
      url: 'https://www.pref.fukui.lg.jp/doc/sabo/tsunamishinsuisoutei_d/fil/gaiyou.pdf',
      sha256:
        '4ecbef9cd1580e4cfbc72b4d75e504f9629bbc3e3bb489ca213e1934b5f653c9',
      bytes: 776136,
      retrievedAt: '2026-09-10T16:42:53.460737+00:00',
    },
    {
      name: 'fukushima-scenarios.pdf',
      url: 'https://www.pref.fukushima.lg.jp/uploaded/attachment/529797.pdf',
      sha256:
        '218e357fe9a11ee54045260e38d78733a93d26c758ad39558a949d1150cf895d',
      bytes: 1350673,
      retrievedAt: '2026-09-10T16:42:52.131530+00:00',
    },
    {
      name: 'gifu-scenarios.pdf',
      url: 'https://www.pref.gifu.lg.jp/uploaded/attachment/344348.pdf',
      sha256:
        'be80f609902cb9aff348172624a8b821512326d035a40c2e381f2dcf4184d7fa',
      bytes: 266843,
      retrievedAt: '2026-09-10T16:58:23.479834+00:00',
    },
    {
      name: 'hokkaido-coastal-coverage.html',
      url: 'https://www.pref.hokkaido.lg.jp/kn/sbs/tunamibousai-page.html',
      sha256:
        '72cb61c67c461bd324ba89a7807d74d89bbd7ded838031184d13f330e5726dca',
      bytes: 23195,
      retrievedAt: '2026-09-10T17:03:57.741423+00:00',
    },
    {
      name: 'hokkaido-okhotsk.pdf',
      url: 'https://www.pref.hokkaido.lg.jp/fs/7/9/6/7/3/2/1/_/%E8%B3%87%E6%96%991-5_%E3%82%AA%E3%83%9B%E3%83%BC%E3%83%84%E3%82%AF%E6%B5%B7%E6%B2%BF%E5%B2%B8%E3%81%AE%E6%B4%A5%E6%B3%A2%E6%B5%B8%E6%B0%B4%E6%83%B3%E5%AE%9A%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6(%E8%A7%A3%E8%AA%AC)%E6%9C%AC%E7%B7%A8.pdf',
      sha256:
        '42a8c857a9f97587d891eac78b7226adb606390d72b09a4ead298923a7dc52f6',
      bytes: 1341206,
      retrievedAt: '2026-09-10T16:58:20.811483+00:00',
    },
    {
      name: 'hyogo-japansea.pdf',
      url: 'https://web.pref.hyogo.lg.jp/kk37/documents/nihonkaitsunamikaisetsu.pdf',
      sha256:
        'e693fba4864056da588570afb5acfd9454d487aea93fb260f736daa7b31b26f3',
      bytes: 2745232,
      retrievedAt: '2026-09-10T17:03:57.129510+00:00',
    },
    {
      name: 'hyogo-seto-final.html',
      url: 'https://web.pref.hyogo.lg.jp/kk37/nantorashinsuisouteizu.html',
      sha256:
        'b36dff16681116e92335590288ad951f0ac70485245a80142e13bcce08acb211',
      bytes: 31709,
      retrievedAt: '2026-09-10T17:08:07.899696+00:00',
    },
    {
      name: 'hyogo-seto-final.pdf',
      url: 'https://web.pref.hyogo.lg.jp/kk37/documents/nannkaisouteikaisetu.pdf',
      sha256:
        'ec532a4d7f5606000d08e1a0ba903ad2cf4ca281cc8b4f35d6fe493d12290377',
      bytes: 1858466,
      retrievedAt: '2026-09-10T17:10:19.056364+00:00',
    },
    {
      name: 'hyogo-terms.pdf',
      url: 'https://web.pref.hyogo.lg.jp/kk26/johoseisaku/documents/kiyaku_opendata.pdf',
      sha256:
        'f5964f9da77b12593ca5824a1e5d8e7770e02d8c3dc8c030496ff2210f8ad7e8',
      bytes: 116854,
      retrievedAt: '2026-09-10T17:03:56.711028+00:00',
    },
    {
      name: 'ibaraki-detail.html',
      url: 'https://www.pref.ibaraki.jp/doboku/kasen/coast/035100.html',
      sha256:
        '3b71c857a08dd39248e5c26ad025e8cdfa2e1207b560f5fd198d71102398fe65',
      bytes: 21086,
      retrievedAt: '2026-09-10T17:01:01.190869+00:00',
    },
    {
      name: 'ibaraki-scenarios.pdf',
      url: 'https://www.pref.ibaraki.jp/doboku/kasen/coast/documents/hajimeni_l2.pdf',
      sha256:
        '8bd8a3f26e2ab21d0deb190f5c1336461b0dd469a67dbba787b31d294185bcc7',
      bytes: 3129339,
      retrievedAt: '2026-09-10T17:06:22.526099+00:00',
    },
    {
      name: 'ishikawa-scenarios.html',
      url: 'https://www.pref.ishikawa.lg.jp/bousai/bousai_g/tsunami/h28tsunami.html',
      sha256:
        '8153fb8a12b16d1f0f082f2c80d5357bb643f88a6ed062b851e2318df55104dd',
      bytes: 39205,
      retrievedAt: '2026-09-10T16:42:52.283816+00:00',
    },
    {
      name: 'ishikawa-scenarios.pdf',
      url: 'https://www.pref.ishikawa.lg.jp/bousai/bousai_g/tsunami/documents/tsunami-kaisetsu.pdf',
      sha256:
        '4b7cae71f372317967405a445dc3540e476a2aeab8d1fa40e69822c276190eb6',
      bytes: 5291881,
      retrievedAt: '2026-09-10T16:58:22.954038+00:00',
    },
    {
      name: 'iwate-scenarios.html',
      url: 'https://www.pref.iwate.jp/kendozukuri/kasensabou/kaigan/1038410/1053312/index.html',
      sha256:
        '4b9aa04fdfd74c84babdc68b234b41c60978d0613fa0f9af512e5ef4d36d8e16',
      bytes: 39719,
      retrievedAt: '2026-09-10T16:58:22.162347+00:00',
    },
    {
      name: 'iwate-scenarios.pdf',
      url: 'https://www.pref.iwate.jp/_res/projects/default_project/_page_/001/053/312/kaisetsusyo.pdf',
      sha256:
        '671dffa59e211f474beeed182ebff8b99724db1294662392cc99d5cb4a53d720',
      bytes: 13140237,
      retrievedAt: '2026-09-10T16:59:43.666964+00:00',
    },
    {
      name: 'kagoshima-scenarios.pdf',
      url: 'https://www.pref.kagoshima.jp/ah07/bosai/sonae/sonae/documents/41671_20210329135921-1.pdf',
      sha256:
        'ef3b7b33a665cc868f93a5e13b4f479e17742f6cc9015da39e4580a7196cb902',
      bytes: 5154647,
      retrievedAt: '2026-09-10T16:58:25.124368+00:00',
    },
    {
      name: 'kanagawa-scenarios.pdf',
      url: 'https://www.pref.kanagawa.jp/uploaded/attachment/774580.pdf',
      sha256:
        'cb51701ed53accec5b574f31d1a4db36ab094b1eb517feafd54bffc99b4430bc',
      bytes: 1846997,
      retrievedAt: '2026-09-10T16:59:41.243512+00:00',
    },
    {
      name: 'kumamoto-minister-report.pdf',
      url: 'https://www.mlit.go.jp/river/shinngikai_blog/shaseishin/kasenbunkakai/bunkakai/dai50kai/siryou3-4.pdf',
      sha256:
        'e91e1680834815ec4225ead2e49f5554d17fa3f66c925345662e1e7f481477ad',
      bytes: 22021640,
      retrievedAt: '2026-09-10T17:09:16.843125+00:00',
    },
    {
      name: 'kumamoto-scenarios.html',
      url: 'https://www.pref.kumamoto.jp/soshiki/105/51653.html',
      sha256:
        '5a18f33449fa6fb085dac87a475844e1a47ad90818db429e2efe320d72de527d',
      bytes: 51306,
      retrievedAt: '2026-09-10T16:58:24.039313+00:00',
    },
    {
      name: 'miyagi-scenarios.pdf',
      url: 'https://www.pref.miyagi.jp/documents/39258/kaisetsusho.pdf',
      sha256:
        'a4ea1bf8d3e5316bac7b076edc4806770d1d865566d49583476e65fc2cf25b49',
      bytes: 2248261,
      retrievedAt: '2026-09-10T16:58:23.273079+00:00',
    },
    {
      name: 'miyagi-terms-index.html',
      url: 'https://www.pref.miyagi.jp/site/opendata-miyagi/kokudo-kisho.html',
      sha256:
        '4a9cd62431abd613bc0022c7e7b4abcb273cb4c0597b5e1b464324a9f0beb6f4',
      bytes: 30692,
      retrievedAt: '2026-09-10T16:59:42.095558+00:00',
    },
    {
      name: 'miyagi-terms.html',
      url: 'https://miyagi.dataeye.jp/pages/terms',
      sha256:
        '56a2e55cb69f7499f9c381fd1d9224d4430ef7527f502ac9b05d621d3a1e7a2d',
      bytes: 16103,
      retrievedAt: '2026-09-10T17:00:54.551213+00:00',
    },
    {
      name: 'miyazaki-historical.html',
      url: 'https://www.pref.miyazaki.lg.jp/kiki-kikikanri/kurashi/bosai/page00150.html',
      sha256:
        '802cecaf3e105cf449871d25965e59a9d2f90e06de60d4f52eaae3a78705fdd6',
      bytes: 27357,
      retrievedAt: '2026-09-10T17:03:57.437121+00:00',
    },
    {
      name: 'okayama-minister-report.pdf',
      url: 'https://www.mlit.go.jp/river/shinngikai_blog/shaseishin/kasenbunkakai/bunkakai/dai50kai/siryou3-10.pdf',
      sha256:
        '6fe4ad0b844f4dfdc27c4f9f688c9baca484a944598159c8285b0ea4708985c2',
      bytes: 50422644,
      retrievedAt: '2026-09-10T17:09:15.965729+00:00',
    },
    {
      name: 'okinawa-scenarios.pdf',
      url: 'https://www.pref.okinawa.jp/_res/projects/default_project/_page_/001/020/541/kaisetu.pdf',
      sha256:
        'f5ff4e63f1d9a2af97bb74029e16731877b7366d55491203de0da6cdd496679b',
      bytes: 1223662,
      retrievedAt: '2026-09-10T16:59:41.545265+00:00',
    },
    {
      name: 'osaka-historical.pdf',
      url: 'https://www.pref.osaka.lg.jp/documents/91/95kaisetu_1.pdf',
      sha256:
        '69477344b1155b190cd9cd6cc8876c9af880d9fee7d6ec84c025899de74d738b',
      bytes: 1664184,
      retrievedAt: '2026-09-10T16:58:23.792607+00:00',
    },
    {
      name: 'saga-description.pdf',
      url: 'https://www.pref.saga.lg.jp/kiji00312186/3_12186_358275_up_13br4avn.pdf',
      sha256:
        '12771018a7fa9676c79d04454878ef8d5c17e166c1fc1087d90a5c027d5591d3',
      bytes: 3057099,
      retrievedAt: '2026-09-10T17:03:59.241530+00:00',
    },
    {
      name: 'saga-scenarios.html',
      url: 'https://www.pref.saga.lg.jp/kiji00312186/index.html',
      sha256:
        '33094c624d7c55214a0657dc7fafcddbc957db6baab97d373f512783ccd0d0d9',
      bytes: 139289,
      retrievedAt: '2026-09-10T17:01:01.372593+00:00',
    },
    {
      name: 'shimane-scenarios.html',
      url: 'https://www.pref.shimane.lg.jp/bousai_info/bousai/bousai/bosai_shiryo/tsunamishinsui_souteizuH29.html',
      sha256:
        '16fcefade531d3be8cfac125515c2fc50575583916c4260339d289ec659f28ec',
      bytes: 209496,
      retrievedAt: '2026-09-10T17:01:00.891157+00:00',
    },
    {
      name: 'shimane-scenarios.pdf',
      url: 'https://www.pref.shimane.lg.jp/bousai_info/bousai/bousai/bosai_shiryo/tsunamishinsui_souteizuH29.data/tsunamishinsuisoutei_kaisetsu.pdf',
      sha256:
        '2a97ed6da02cdf93ed052c1b2327dbec0117d71ce318afd73627f7933d36347c',
      bytes: 5549984,
      retrievedAt: '2026-09-10T17:03:58.115284+00:00',
    },
    {
      name: 'shimane-terms.html',
      url: 'https://shimane-opendata.jp/pages/terms',
      sha256:
        '69210d68b488bb783bdd558d0c45f0ded7cf4cb5cf462d5da62df05c1c13a8d7',
      bytes: 14192,
      retrievedAt: '2026-09-10T17:01:00.707807+00:00',
    },
    {
      name: 'tokyo-scenarios.pdf',
      url: 'https://www.bousai.metro.tokyo.lg.jp/_res/projects/default_project/_page_/001/023/364/1.pdf',
      sha256:
        '3c6816760d967b8532a6e32a6ebaf16032ced548f0bb07cbbd297b3bfb397244',
      bytes: 3127169,
      retrievedAt: '2026-09-10T16:58:23.510170+00:00',
    },
    {
      name: 'tottori-scenarios.html',
      url: 'https://www.pref.tottori.lg.jp/274286.htm',
      sha256:
        '68eca1570d62c2819911c33b30114b12cc205710529d36667e280ddcd92f1604',
      bytes: 50538,
      retrievedAt: '2026-09-10T16:42:52.477866+00:00',
    },
    {
      name: 'tottori-scenarios.pdf',
      url: 'https://www.pref.tottori.lg.jp/secure/1115471/kaisetusho.pdf',
      sha256:
        'ac8107fe3172d2d9a88e035571a6cfce53ea2577dfb637fa64df6f3b9333c03f',
      bytes: 2754340,
      retrievedAt: '2026-09-10T16:58:21.910383+00:00',
    },
    {
      name: 'toyama-scenarios.html',
      url: 'https://www.pref.toyama.jp/1900/bousaianzen/bousai/suigai/kj00017580.html',
      sha256:
        '65c79294bf01add6430065392355c1a22fc89554aaa81b44b4eaa1d779d61c56',
      bytes: 27871,
      retrievedAt: '2026-09-10T16:42:52.189475+00:00',
    },
    {
      name: 'toyama-scenarios.pdf',
      url: 'https://www.pref.toyama.jp/documents/9136/01.pdf',
      sha256:
        '09e82ead0a49e416be859100ae136d448a3477facd9ab7fe781aa8d47b2fdc60',
      bytes: 9227627,
      retrievedAt: '2026-09-10T16:58:22.889900+00:00',
    },
    {
      name: 'yamagata-scenarios.pdf',
      url: 'https://www.pref.yamagata.jp/documents/1692/dai5kaisiryou1-2.pdf',
      sha256:
        '0abae6a2f52ffdff5a228fc2bd316edd6ece9a4c81c95252b607f6e3e11c0247',
      bytes: 1266555,
      retrievedAt: '2026-09-10T16:42:52.127217+00:00',
    },
    {
      name: 'yamaguchi-historical.html',
      url: 'https://www.pref.yamaguchi.lg.jp/soshiki/6/12626.html',
      sha256:
        'd453710bcd80196f4307b05528fdbf64a3d195811f9c052109e9a8b5e5eca16d',
      bytes: 36191,
      retrievedAt: '2026-09-10T16:58:23.868157+00:00',
    },
    {
      name: 'yamaguchi-historical.pdf',
      url: 'https://www.pref.yamaguchi.lg.jp/uploaded/attachment/20321.pdf',
      sha256:
        '9964ff9f40f93ecfce6b42a00788d891cce7767cf37e1e5c51db4434eb931bc7',
      bytes: 3200949,
      retrievedAt: '2026-09-10T16:59:44.450283+00:00',
    },
    {
      name: 'yamaguchi-seto-minister.pdf',
      url: 'https://www.mlit.go.jp/river/shinngikai_blog/shaseishin/kasenbunkakai/bunkakai/dai50kai/siryou3-21.pdf',
      sha256:
        '32fc56cf8b962a466e4af26d07d4122c979eb9b0e08c4cb58f653e9e66b269d2',
      bytes: 5171602,
      retrievedAt: '2026-09-10T17:24:15.966565+00:00',
    },
    {
      name: 'ksj-a40-2023.html',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2023.html',
      sha256:
        'f8ad61816d117f86cb8eb4ecc45752420c903ca35a7248ed4d8d71721dfd3455',
      bytes: 100079,
      retrievedAt: '2026-09-10T16:37:39.151439+00:00',
    },
    {
      name: 'ksj-a40-2020.html',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2020.html',
      sha256:
        '756acfbcabfb0b6ddbd23d1b6f692a70c8df6af34ac1a40e6a421c0530be0ca9',
      bytes: 65058,
      retrievedAt: '2026-09-10T16:37:39.147138+00:00',
    },
    {
      name: 'ksj-a40-2018.html',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2018.html',
      sha256:
        'c6202d2b01f4c55ce5c063d79d7f03f6613ad8d24b34eda87ae51ad48bca5585',
      bytes: 60875,
      retrievedAt: '2026-09-10T16:37:39.147555+00:00',
    },
  ],
  scenarios: [
    {
      areaCode: '01000',
      key: 'ksj-01-23-fixed-native-depth',
      label: '北海道・2017・2021・2023年の想定（KSJ 2023年度版）',
      referenceDate: null,
      modelYears: [2017, 2021, 2023],
      model:
        '日本海沿岸2017年、太平洋沿岸2021年・2023年変更、オホーツク海沿岸2023年の最大クラス想定',
      conditions:
        '海域ごとの異なる波源と想定年を含むKSJ統合版。旧17・21年ファイルとの最大値合成は行わない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.hokkaido.lg.jp/fs/7/9/6/7/3/2/1/_/%E8%B3%87%E6%96%991-5_%E3%82%AA%E3%83%9B%E3%83%BC%E3%83%84%E3%82%AF%E6%B5%B7%E6%B2%BF%E5%B2%B8%E3%81%AE%E6%B4%A5%E6%B3%A2%E6%B5%B8%E6%B0%B4%E6%83%B3%E5%AE%9A%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6(%E8%A7%A3%E8%AA%AC)%E6%9C%AC%E7%B7%A8.pdf',
      historical: true,
      inputId: 'hazard-01',
      inputIds: ['hazard-01'],
      bands: [
        {
          key: 'native-0',
          label: '～0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 0.5m未満',
        },
        {
          key: 'native-2',
          label: '0.5m以上 ～ 1m未満',
        },
        {
          key: 'native-3',
          label: '1m以上 ～ 3m未満',
        },
        {
          key: 'native-4',
          label: '3m以上 ～ 5m未満',
        },
        {
          key: 'native-5',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'native-6',
          label: '10m以上 ～ 20m未満',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage:
        '北海道の日本海・太平洋・オホーツク海の沿岸。北方領土の原典人口は収録なし。',
      coverageMunicipalities: null,
      hazardRecords: 563208,
      archiveVersions: ['23'],
    },
    {
      areaCode: '02000',
      key: 'ksj-02-21-fixed-native-depth',
      label: '青森県・2021年の想定（KSJ 2021年度版）',
      referenceDate: null,
      modelYears: [2021],
      model: '青森県全沿岸を2021年5月に変更した複数津波の最大浸水深の包絡',
      conditions:
        '2022年4月28日修正の県解説に対応する全沿岸改定。旧16年の許諾制限付きファイルは使用しない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.aomori.lg.jp/soshiki/kendo/kasensabo/files/01_tsunami_kaisetsu20220428.pdf',
      historical: true,
      inputId: 'hazard-02',
      inputIds: ['hazard-02'],
      bands: [
        {
          key: 'native-0',
          label: '0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 0.5m未満',
        },
        {
          key: 'native-2',
          label: '0.5m以上 ～ 1m未満',
        },
        {
          key: 'native-3',
          label: '1m以上 ～ 3m未満',
        },
        {
          key: 'native-4',
          label: '3m以上 ～ 5m未満',
        },
        {
          key: 'native-5',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'native-6',
          label: '10m以上 ～ 20m未満',
        },
        {
          key: 'native-7',
          label: '20m以上',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '岩手県境の階上町から秋田県境の深浦町までの全沿岸。',
      coverageMunicipalities: null,
      hazardRecords: 130043,
      archiveVersions: ['21'],
    },
    {
      areaCode: '03000',
      key: 'ksj-03-22-fixed-native-depth',
      label: '岩手県・2022年の想定（KSJ 2022年度版）',
      referenceDate: null,
      modelYears: [2022],
      model: '岩手県が2022年3月29日に公表した最大クラス津波の想定',
      conditions:
        '対象津波と防潮施設等の条件は県解説書に固定。複数の想定結果から地点ごとの最大浸水深を示す。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.iwate.jp/_res/projects/default_project/_page_/001/053/312/kaisetsusyo.pdf',
      historical: true,
      inputId: 'hazard-03',
      inputIds: ['hazard-03'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 ～ 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 0.5m未満',
        },
        {
          key: 'native-2',
          label: '0.5m以上 ～ 1.0m未満',
        },
        {
          key: 'native-3',
          label: '1.0m以上 ～ 3.0m未満',
        },
        {
          key: 'native-4',
          label: '3.0m以上 ～ 5.0m未満',
        },
        {
          key: 'native-5',
          label: '5.0m以上 ～ 10.0m未満',
        },
        {
          key: 'native-6',
          label: '10.0m以上 ～ 20.0m未満',
        },
        {
          key: 'native-7',
          label: '20.0m以上',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage:
        '岩手県の沿岸12市町村。県全体の人口原典を照合母集団とする。',
      coverageMunicipalities: null,
      hazardRecords: 233714,
      archiveVersions: ['22'],
    },
    {
      areaCode: '04000',
      key: 'ksj-04-22-fixed-native-depth',
      label: '宮城県・2022年の想定（KSJ 2022年度版）',
      referenceDate: null,
      modelYears: [2022],
      model:
        '東北地方太平洋沖・日本海溝・千島海溝の3想定を重ねた2022年5月の最大クラス津波',
      conditions:
        '地盤変動と2019年12月時点の復旧・復興事業を反映した県原典。CC BY 4.0と県ポータル規約に従い出典と加工を明示。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl: 'https://www.pref.miyagi.jp/documents/39258/kaisetsusho.pdf',
      historical: true,
      inputId: 'hazard-04',
      inputIds: ['hazard-04'],
      bands: [
        {
          key: 'native-0',
          label: '0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 0.5m未満',
        },
        {
          key: 'native-2',
          label: '0.5m以上 ～ 1.0m未満',
        },
        {
          key: 'native-3',
          label: '1m以上 ～ 3m未満',
        },
        {
          key: 'native-4',
          label: '3m以上 ～ 5m未満',
        },
        {
          key: 'native-5',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'native-6',
          label: '10m以上 ～ 20m未満',
        },
        {
          key: 'native-7',
          label: '20m以上',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '宮城県沿岸の法定津波浸水想定。',
      coverageMunicipalities: null,
      hazardRecords: 204101,
      archiveVersions: ['22'],
    },
    {
      areaCode: '05000',
      key: 'ksj-05-16-fixed-native-depth',
      label: '秋田県・2016年の想定（KSJ 2016年度版）',
      referenceDate: null,
      modelYears: [2016],
      model: '国の4断層と秋田県独自の海域A・B・C連動断層による12ケースの包絡',
      conditions:
        '2016年3月公表。最大クラスが悪条件下で発生する想定であり、将来の発生時期を示さない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.akita.lg.jp/uploads/public/archive_0000053908_00/%E6%B4%A5%E6%B3%A2%E6%B5%B8%E6%B0%B4%E6%83%B3%E5%AE%9A%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%EF%BC%88%E8%A7%A3%E8%AA%AC%EF%BC%89.pdf',
      historical: true,
      inputId: 'hazard-05',
      inputIds: ['hazard-05'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 ～ 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 1m未満',
        },
        {
          key: 'native-2',
          label: '1m以上 ～ 2m未満',
        },
        {
          key: 'native-3',
          label: '2m以上 ～ 5m未満',
        },
        {
          key: 'native-4',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'native-5',
          label: '10m以上 ～ 20m未満',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '秋田県の日本海沿岸。',
      coverageMunicipalities: null,
      hazardRecords: 75921,
      archiveVersions: ['16'],
    },
    {
      areaCode: '06000',
      key: 'ksj-06-16-fixed-native-depth',
      label: '山形県・2016年の想定（KSJ 2016年度版）',
      referenceDate: null,
      modelYears: [2016],
      model: 'F28・F30・F34の3断層13ケースによる山形県の最大クラス津波',
      conditions: '県の設定した地盤変動・構造物条件による最大浸水深の包絡。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.yamagata.jp/documents/1692/dai5kaisiryou1-2.pdf',
      historical: true,
      inputId: 'hazard-06',
      inputIds: ['hazard-06'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 ～ 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 1m未満',
        },
        {
          key: 'native-2',
          label: '1m以上 ～ 2m未満',
        },
        {
          key: 'native-3',
          label: '2m以上 ～ 5m未満',
        },
        {
          key: 'native-4',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'native-5',
          label: '10m以上',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '山形県の日本海沿岸と飛島。',
      coverageMunicipalities: null,
      hazardRecords: 14622,
      archiveVersions: ['16'],
    },
    {
      areaCode: '07000',
      key: 'ksj-07-23-fixed-native-depth',
      label: '福島県・2022年の想定（KSJ 2023年度版）',
      referenceDate: null,
      modelYears: [2022],
      model:
        '東北地方太平洋沖、房総沖、日本海溝、千島海溝の4波源による2022年8月31日の想定',
      conditions: 'KSJ 2023統合版を採用。旧21年ファイルと最大値合成しない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.fukushima.lg.jp/uploaded/attachment/529797.pdf',
      historical: true,
      inputId: 'hazard-07',
      inputIds: ['hazard-07'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 ～ 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 0.5m未満',
        },
        {
          key: 'native-2',
          label: '0.5m以上 ～ 1.0m未満',
        },
        {
          key: 'native-3',
          label: '1.0m以上 ～ 3.0m未満',
        },
        {
          key: 'native-4',
          label: '3.0m以上 ～ 5.0m未満',
        },
        {
          key: 'native-5',
          label: '5.0m以上 ～ 10.0m未満',
        },
        {
          key: 'native-6',
          label: '10.0m以上 ～ 20.0m未満',
        },
        {
          key: 'native-7',
          label: '20.0m以上',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '福島県の全沿岸。',
      coverageMunicipalities: null,
      hazardRecords: 60217,
      archiveVersions: ['23'],
    },
    {
      areaCode: '08000',
      key: 'ksj-08-23-fixed-native-depth',
      label: '茨城県・2012年の想定（KSJ 2023年度版）',
      referenceDate: null,
      modelYears: [2012],
      model:
        '東北地方太平洋沖地震津波とH23想定津波の2種類を重ねた2012年8月の最大クラス想定',
      conditions:
        '各波源の全沿岸シミュレーションから最大浸水域・深を抽出。KSJ 2023統合版だけを使用し、許諾制限のある旧16年版は使わない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.ibaraki.jp/doboku/kasen/coast/documents/hajimeni_l2.pdf',
      historical: true,
      inputId: 'hazard-08',
      inputIds: ['hazard-08'],
      bands: [
        {
          key: 'native-0',
          label: '～0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 1.0m未満',
        },
        {
          key: 'native-2',
          label: '1.0m以上 ～ 2.0m未満',
        },
        {
          key: 'native-3',
          label: '2.0m以上 ～ 5.0m未満',
        },
        {
          key: 'native-4',
          label: '5.0m以上 ～ 10.0m未満',
        },
        {
          key: 'native-5',
          label: '10.0m以上 ～ 20.0m未満',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '茨城沿岸全域。',
      coverageMunicipalities: null,
      hazardRecords: 72555,
      archiveVersions: ['23'],
    },
    {
      areaCode: '12000',
      key: 'ksj-12-18-fixed-native-depth',
      label: '千葉県・2018年の想定（KSJ 2018年度版）',
      referenceDate: null,
      modelYears: [2018],
      model: '千葉県が選定した5種類の津波による2018年11月の最大クラス想定',
      conditions:
        '県解説の注意事項を確認。局所的な凹凸・建築物・地盤変動・構造物変状との差により原典区域外の浸水もあり得る。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.chiba.lg.jp/kendosei/documents/tunami-kaisetusho.pdf',
      historical: true,
      inputId: 'hazard-12',
      inputIds: ['hazard-12'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 0.5m未満',
        },
        {
          key: 'native-2',
          label: '0.5m以上 1.0m未満',
        },
        {
          key: 'native-3',
          label: '1.0m以上 3.0m未満',
        },
        {
          key: 'native-4',
          label: '3.0m以上 5.0m未満',
        },
        {
          key: 'native-5',
          label: '5.0m以上 10.0m未満',
        },
        {
          key: 'native-6',
          label: '10.0m以上 20.0m未満',
        },
        {
          key: 'native-7',
          label: '20.0m以上',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '千葉県の東京湾・太平洋沿岸。',
      coverageMunicipalities: null,
      hazardRecords: 175389,
      archiveVersions: ['18'],
    },
    {
      areaCode: '13000',
      key: 'ksj-13-23-fixed-native-depth',
      label: '東京都・2023年の想定（KSJ 2023年度版）',
      referenceDate: null,
      modelYears: [2023],
      model:
        '延宝房総沖・元禄関東・南海トラフケース1・2・5・6・8の7想定を重ねた島しょ部の最大浸水深',
      conditions:
        '本土など対象9町村以外は未対象区分へ保存。9町村内のポリゴン非該当は対象外の島も含み得る未判定値であり、浸水区域外の確定値にはしない。相模トラフ巨大地震は今回の想定に含まない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.bousai.metro.tokyo.lg.jp/_res/projects/default_project/_page_/001/023/364/1.pdf',
      historical: true,
      inputId: 'hazard-13',
      inputIds: ['hazard-13'],
      bands: [
        {
          key: 'native-0',
          label: '～0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 0.5m未満',
        },
        {
          key: 'native-2',
          label: '0.5m以上 ～ 1m未満',
        },
        {
          key: 'native-3',
          label: '1m以上 ～ 3m未満',
        },
        {
          key: 'native-4',
          label: '3m以上 ～ 5m未満',
        },
        {
          key: 'native-5',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'native-6',
          label: '10m以上 ～ 20m未満',
        },
        {
          key: 'native-7',
          label: '20m以上',
        },
        {
          key: 'not-in-positive-source',
          label: '浸水ポリゴン非該当（未判定）',
        },
        {
          key: 'outside-model-coverage',
          label: '想定対象9町村以外（本土等・未対象）',
        },
      ],
      modelCoverage:
        '大島・利島・新島・式根島・神津島・三宅島・御蔵島・八丈島・青ヶ島・父島・母島。本土を含まない。9町村全域がモデル化されたことも意味しない。',
      coverageMunicipalities: [
        '13361',
        '13362',
        '13363',
        '13364',
        '13381',
        '13382',
        '13401',
        '13402',
        '13421',
      ],
      hazardRecords: 33124,
      archiveVersions: ['23'],
    },
    {
      areaCode: '14000',
      key: 'ksj-14-20-fixed-native-depth',
      label: '神奈川県・2015年の想定（KSJ 2020年度版）',
      referenceDate: null,
      modelYears: [2015],
      model: '神奈川県が2015年3月31日に公表した5つの地震の最大浸水域・深の包絡',
      conditions:
        'KSJ 2020年版を採用し、商用・再配信制限の記載がある旧16年版は使用しない。波源と構造物条件は県解説に固定。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl: 'https://www.pref.kanagawa.jp/uploaded/attachment/774580.pdf',
      historical: true,
      inputId: 'hazard-14',
      inputIds: ['hazard-14'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 ～ 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 1m未満',
        },
        {
          key: 'native-2',
          label: '1m以上 ～ 2m未満',
        },
        {
          key: 'native-3',
          label: '2m以上 ～ 3m未満',
        },
        {
          key: 'native-4',
          label: '3m以上 ～ 4m未満',
        },
        {
          key: 'native-5',
          label: '4m以上 ～ 5m未満',
        },
        {
          key: 'native-6',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'native-7',
          label: '10m以上 ～ 20m未満',
        },
        {
          key: 'native-8',
          label: '20m以上',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '神奈川県の沿岸地域。',
      coverageMunicipalities: null,
      hazardRecords: 66965,
      archiveVersions: ['20'],
    },
    {
      areaCode: '16000',
      key: 'ksj-16-20-fixed-native-depth',
      label: '富山県・2017年の想定（KSJ 2020年度版）',
      referenceDate: null,
      modelYears: [2017],
      model: '富山県の津波防災地域づくり法に基づく最大クラスの津波浸水想定',
      conditions:
        '法律に基づく想定を採用。別に公表された日本海地震・津波調査プロジェクトを含む参考想定と混ぜない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl: 'https://www.pref.toyama.jp/documents/9136/01.pdf',
      historical: true,
      inputId: 'hazard-16',
      inputIds: ['hazard-16'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 ～ 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 0.5m未満',
        },
        {
          key: 'native-2',
          label: '0.5m以上 ～ 1m未満',
        },
        {
          key: 'native-3',
          label: '1m以上 ～ 3m未満',
        },
        {
          key: 'native-4',
          label: '3m以上 ～ 5m未満',
        },
        {
          key: 'native-5',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '富山県の海岸・河口周辺。',
      coverageMunicipalities: null,
      hazardRecords: 20017,
      archiveVersions: ['20'],
    },
    {
      areaCode: '17000',
      key: 'ksj-17-17-fixed-native-depth',
      label: '石川県・2017年の想定（KSJ 2017年度版）',
      referenceDate: null,
      modelYears: [2017],
      model:
        'F35・F41・F42・F43・F45・F47・F49から選定した石川県の最大浸水深の包絡',
      conditions:
        '2024年能登半島地震後の地形変化・再検討を反映する最新ハザードとは扱わない。旧2011年度想定との最大値合成もしない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.ishikawa.lg.jp/bousai/bousai_g/tsunami/documents/tsunami-kaisetsu.pdf',
      historical: true,
      inputId: 'hazard-17',
      inputIds: ['hazard-17'],
      bands: [
        {
          key: 'native-0',
          label: '0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 0.5m未満',
        },
        {
          key: 'native-2',
          label: '0.5m以上 ～ 1m未満',
        },
        {
          key: 'native-3',
          label: '1m以上 ～ 3m未満',
        },
        {
          key: 'native-4',
          label: '3m以上 ～ 5m未満',
        },
        {
          key: 'native-5',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'native-6',
          label: '10m以上 ～ 20m未満',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '石川県沿岸の2017年度想定。',
      coverageMunicipalities: null,
      hazardRecords: 46630,
      archiveVersions: ['17'],
    },
    {
      areaCode: '18000',
      key: 'ksj-18-23-fixed-native-depth',
      label: '福井県・2020年の想定（KSJ 2023年度版）',
      referenceDate: null,
      modelYears: [2020],
      model: '福井県が2020年10月に設定した5断層の最大クラス津波',
      conditions:
        '県独自の2012年度想定と地震規模・浸水面積が異なる。2020年法定想定を収録したKSJ 2023版に固定。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.fukui.lg.jp/doc/sabo/tsunamishinsuisoutei_d/fil/gaiyou.pdf',
      historical: true,
      inputId: 'hazard-18',
      inputIds: ['hazard-18'],
      bands: [
        {
          key: 'native-0',
          label: '～0.3m',
        },
        {
          key: 'native-1',
          label: '0.3～0.5m',
        },
        {
          key: 'native-2',
          label: '0.5～1m',
        },
        {
          key: 'native-3',
          label: '1～3m',
        },
        {
          key: 'native-4',
          label: '3～5m',
        },
        {
          key: 'native-5',
          label: '5m～',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '福井県の日本海沿岸。',
      coverageMunicipalities: null,
      hazardRecords: 19846,
      archiveVersions: ['23'],
    },
    {
      areaCode: '21000',
      key: 'ksj-21-23-fixed-native-depth',
      label: '岐阜県・2022年の想定（KSJ 2023年度版）',
      referenceDate: null,
      modelYears: [2022],
      model:
        '南海トラフ巨大地震による河川遡上を対象に、堤防・水門の整備を反映した2022年12月改定',
      conditions:
        '河川管理者の耐震点検と対策済み施設を反映。浸水範囲が縮小した旧2017年版との最大値合成は禁止。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl: 'https://www.pref.gifu.lg.jp/uploaded/attachment/344348.pdf',
      historical: true,
      inputId: 'hazard-21',
      inputIds: ['hazard-21'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 ～ 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 0.5m未満',
        },
        {
          key: 'native-2',
          label: '0.5m以上 ～ 1m未満',
        },
        {
          key: 'native-3',
          label: '1m以上 ～ 3m未満',
        },
        {
          key: 'native-4',
          label: '3m以上 ～ 5m未満',
        },
        {
          key: 'native-5',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'native-6',
          label: '10m以上 ～ 20m未満',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '岐阜県の木曽三川下流部。海岸を持つ県だけの分析ではない。',
      coverageMunicipalities: null,
      hazardRecords: 6440,
      archiveVersions: ['23'],
    },
    {
      areaCode: '22000',
      key: 'shizuoka-ksj2016-level2-envelope',
      label: '静岡県・レベル2最大浸水深の包絡（KSJ 2016年基準）',
      referenceDate: '2016-10-31',
      modelYears: [2013, 2015],
      model:
        '南海トラフケース1・2・6・7・8・9、元禄型関東、相模トラフ最大クラスケース1・2・3の最大浸水深を重ねた想定',
      conditions:
        'コンクリート堤防は倒壊、土堤は地震前の25%の高さで越流時に消失する条件。異なる波源・時刻の最大値の包絡。',
      pageUrl: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40.html',
      methodUrl:
        'https://www.pref.shizuoka.jp/_res/projects/default_project/_page_/001/029/868/saidaisinnsuiikizu-01.pdf',
      historical: true,
      inputId: 'hazard-22',
      bands: [
        {
          key: 'd001-03',
          label: '0.01m以上0.3m未満',
        },
        {
          key: 'd03-1',
          label: '0.3m以上1m未満',
        },
        {
          key: 'd1-2',
          label: '1m以上2m未満',
        },
        {
          key: 'd2-3',
          label: '2m以上3m未満',
        },
        {
          key: 'd3-5',
          label: '3m以上5m未満',
        },
        {
          key: 'd5-10',
          label: '5m以上10m未満',
        },
        {
          key: 'd10-20',
          label: '10m以上20m未満',
        },
        {
          key: 'd20plus',
          label: '20m以上',
        },
        {
          key: 'outside-published-inundation',
          label: '採用した原典の浸水区域外',
        },
      ],
      inputIds: ['hazard-22'],
      modelCoverage: '静岡県全沿岸。',
      coverageMunicipalities: null,
      hazardRecords: 113272,
      archiveVersions: ['16'],
    },
    {
      areaCode: '23000',
      key: 'ksj-23-22-fixed-native-depth',
      label: '愛知県・2014年の想定（KSJ 2022年度版）',
      referenceDate: null,
      modelYears: [2014],
      model: '南海トラフのケース1・6・7・8・9による2014年公表の最大クラス津波',
      conditions:
        'KSJ 2022年版を固定使用。2026年6月の改定想定を反映した値ではない。旧版の県説明書は削除済みのため国交省保存の県知事報告で波源条件を照合。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.mlit.go.jp/river/shinngikai_blog/shaseishin/kasenbunkakai/bunkakai/dai51kai/siryou3-4.pdf',
      historical: true,
      inputId: 'hazard-23',
      inputIds: ['hazard-23'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 ～ 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 1.0m未満',
        },
        {
          key: 'native-2',
          label: '1m以上 ～ 2m未満',
        },
        {
          key: 'native-3',
          label: '2m以上 ～ 5m未満',
        },
        {
          key: 'native-4',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'native-5',
          label: '10m以上 ～ 20m未満',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '愛知県沿岸と河川遡上域の歴史版。',
      coverageMunicipalities: null,
      hazardRecords: 129834,
      archiveVersions: ['22'],
    },
    {
      areaCode: '27000',
      key: 'ksj-27-23-fixed-native-depth',
      label: '大阪府・2013年の想定（KSJ 2023年度版）',
      referenceDate: null,
      modelYears: [2013],
      model:
        '南海トラフのケース3・4・5・10と防潮施設の開閉条件を重ねた大阪府の最大クラス津波',
      conditions:
        'KSJ 2023統合版を採用。2026年3月31日改定を反映した最新の避難用データではない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl: 'https://www.pref.osaka.lg.jp/documents/91/95kaisetu_1.pdf',
      historical: true,
      inputId: 'hazard-27',
      inputIds: ['hazard-27'],
      bands: [
        {
          key: 'native-0',
          label: '0.01～0.3m',
        },
        {
          key: 'native-1',
          label: '0.3～1.0m',
        },
        {
          key: 'native-2',
          label: '1.0～2.0m',
        },
        {
          key: 'native-3',
          label: '2.0～3.0m',
        },
        {
          key: 'native-4',
          label: '3.0～4.0m',
        },
        {
          key: 'native-5',
          label: '4.0～5.0m',
        },
        {
          key: 'native-6',
          label: '5.0m～',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '大阪府沿岸の2013年公表想定。',
      coverageMunicipalities: null,
      hazardRecords: 42434,
      archiveVersions: ['23'],
    },
    {
      areaCode: '28000',
      key: 'ksj-28-16-18-fixed-native-depth',
      label: '兵庫県・2013・2014・2018年の想定（KSJ 2016・2018年度版）',
      referenceDate: null,
      modelYears: [2013, 2014, 2018],
      model:
        '瀬戸内海・淡路の南海トラフ想定と、日本海のF24・F49・F52・F54・F55の7ケースをそれぞれ採用',
      conditions:
        'A40-16の南側とA40-18の日本海は地理範囲が非重複。版の新旧を最大値で混ぜず、それぞれの沿岸に対応した最大クラス想定を結合する。県のオープンデータ利用規約による出典・加工表示を保持。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://web.pref.hyogo.lg.jp/kk37/documents/nihonkaitsunamikaisetsu.pdf',
      historical: true,
      inputId: 'hazard-28-16',
      inputIds: ['hazard-28-16', 'hazard-28-18'],
      bands: [
        {
          key: 'native-0',
          label: '0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 1m未満',
        },
        {
          key: 'native-2',
          label: '1m以上 ～ 2m未満',
        },
        {
          key: 'native-3',
          label: '2m以上 ～ 3m未満',
        },
        {
          key: 'native-4',
          label: '3m以上 ～ 4m未満',
        },
        {
          key: 'native-5',
          label: '4m以上 ～ 5m未満',
        },
        {
          key: 'native-6',
          label: '5m以上',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage:
        '南側の神戸・阪神・播磨・淡路と北側の日本海。異なる沿岸の原典を使用。',
      coverageMunicipalities: null,
      hazardRecords: 67420,
      archiveVersions: ['16', '18'],
    },
    {
      areaCode: '31000',
      key: 'ksj-31-18-fixed-native-depth',
      label: '鳥取県・2018年の想定（KSJ 2018年度版）',
      referenceDate: null,
      modelYears: [2018],
      model:
        '鳥取県が選定した日本海の5断層モデルを重ねた2018年3月28日の最大クラス想定',
      conditions:
        '県の原典で地点ごとの最大浸水深を採用。各断層の発生時期や県の安全順位は示さない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl: 'https://www.pref.tottori.lg.jp/secure/1115471/kaisetusho.pdf',
      historical: true,
      inputId: 'hazard-31',
      inputIds: ['hazard-31'],
      bands: [
        {
          key: 'native-0',
          label: '0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 0.5m未満',
        },
        {
          key: 'native-2',
          label: '0.5m以上 ～ 1m未満',
        },
        {
          key: 'native-3',
          label: '1m以上 ～ 3m未満',
        },
        {
          key: 'native-4',
          label: '3m以上 ～ 5m未満',
        },
        {
          key: 'native-5',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '鳥取県の日本海沿岸。',
      coverageMunicipalities: null,
      hazardRecords: 17134,
      archiveVersions: ['18'],
    },
    {
      areaCode: '32000',
      key: 'ksj-32-24-fixed-native-depth',
      label: '島根県・2017年の想定（KSJ 2024年度版）',
      referenceDate: null,
      modelYears: [2017],
      model: '島根県が2017年3月24日に設定した日本海の最大クラス津波',
      conditions:
        'KSJ 2024統合版のみを採用。旧17年版との最大値合成はしない。県ポータルのCC BY 4.0条件と加工表示を保持。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.shimane.lg.jp/bousai_info/bousai/bousai/bosai_shiryo/tsunamishinsui_souteizuH29.data/tsunamishinsuisoutei_kaisetsu.pdf',
      historical: true,
      inputId: 'hazard-32',
      inputIds: ['hazard-32'],
      bands: [
        {
          key: 'native-0',
          label: '～0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 0.5m未満',
        },
        {
          key: 'native-2',
          label: '0.5m以上 ～ 1.0m未満',
        },
        {
          key: 'native-3',
          label: '1.0m以上 ～ 3.0m未満',
        },
        {
          key: 'native-4',
          label: '3.0m以上 ～ 5.0m未満',
        },
        {
          key: 'native-5',
          label: '5.0m以上 ～ 10.0m未満',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '島根県の本土沿岸と隠岐。',
      coverageMunicipalities: null,
      hazardRecords: 50120,
      archiveVersions: ['24'],
    },
    {
      areaCode: '33000',
      key: 'ksj-33-22-fixed-native-depth',
      label: '岡山県・2013年の想定（KSJ 2022年度版）',
      referenceDate: null,
      modelYears: [2013],
      model:
        '南海トラフケース1・2・4・5・6・8の6モデルを重ねた2013年3月22日の最大クラス津波',
      conditions:
        '朔望平均満潮位、地盤沈下、耐震性が十分でない構造物の破壊と越流時破壊を考慮した歴史版。2026年6月改定を反映した値ではない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.mlit.go.jp/river/shinngikai_blog/shaseishin/kasenbunkakai/bunkakai/dai50kai/siryou3-10.pdf',
      historical: true,
      inputId: 'hazard-33',
      inputIds: ['hazard-33'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 ～ 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 1.0m未満',
        },
        {
          key: 'native-2',
          label: '1m以上 ～ 2m未満',
        },
        {
          key: 'native-3',
          label: '2m以上 ～ 3m未満',
        },
        {
          key: 'native-4',
          label: '3m以上 ～ 4m未満',
        },
        {
          key: 'native-5',
          label: '4m以上 ～ 5m未満',
        },
        {
          key: 'native-6',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'native-7',
          label: '10m以上 ～ 20m未満',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '岡山県の瀬戸内海沿岸・河川遡上域。',
      coverageMunicipalities: null,
      hazardRecords: 65056,
      archiveVersions: ['22'],
    },
    {
      areaCode: '35000',
      key: 'ksj-35-16-fixed-native-depth',
      label: '山口県・2014・2015年の想定（KSJ 2016年度版）',
      referenceDate: null,
      modelYears: [2014, 2015],
      model: '山口県の瀬戸内海沿岸2014年と日本海沿岸2015年の最大クラス津波',
      conditions:
        'KSJ 2016年版の両沿岸ポリゴンを使用。2026年3月改定想定を反映した値ではない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.mlit.go.jp/river/shinngikai_blog/shaseishin/kasenbunkakai/bunkakai/dai50kai/siryou3-21.pdf',
      historical: true,
      inputId: 'hazard-35',
      inputIds: ['hazard-35'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 ～ 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 1m未満',
        },
        {
          key: 'native-2',
          label: '1m以上 ～ 2m未満',
        },
        {
          key: 'native-3',
          label: '2m以上 ～ 3m未満',
        },
        {
          key: 'native-4',
          label: '3m以上 ～ 4m未満',
        },
        {
          key: 'native-5',
          label: '4m以上 ～ 5m未満',
        },
        {
          key: 'native-6',
          label: '5m以上',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '山口県の瀬戸内海・日本海の両沿岸。',
      coverageMunicipalities: null,
      hazardRecords: 109310,
      archiveVersions: ['16'],
    },
    {
      areaCode: '36000',
      key: 'tokushima-2025-09-12-level2-envelope',
      label: '徳島県・最大クラス津波浸水想定（2025年9月12日）',
      referenceDate: '2025-09-12',
      modelYears: [2025],
      model:
        '南海トラフケース3・9・10・11から地域海岸ごとに選んだ最大クラスの包絡',
      conditions:
        '最新地形・2019〜2023年の朔望平均満潮位、計算12時間。構造物は耐震・液状化の評価を反映。10m格子中心の値を10mの半開格子へ復元。',
      pageUrl: 'https://opendata.pref.tokushima.lg.jp/dataset/5110.html',
      methodUrl: 'https://www.pref.tokushima.lg.jp/file/attachment/1014560.pdf',
      historical: false,
      inputId: 'hazard-36',
      bands: [
        {
          key: 'd001-03',
          label: '0.01m以上0.3m未満',
        },
        {
          key: 'd03-1',
          label: '0.3m以上1m未満',
        },
        {
          key: 'd1-2',
          label: '1m以上2m未満',
        },
        {
          key: 'd2-3',
          label: '2m以上3m未満',
        },
        {
          key: 'd3-5',
          label: '3m以上5m未満',
        },
        {
          key: 'd5-10',
          label: '5m以上10m未満',
        },
        {
          key: 'd10-20',
          label: '10m以上20m未満',
        },
        {
          key: 'd20plus',
          label: '20m以上',
        },
        {
          key: 'outside-published-inundation',
          label: '採用した原典の浸水区域外',
        },
      ],
      inputIds: ['hazard-36'],
      modelCoverage: '徳島県全沿岸。',
      coverageMunicipalities: null,
      hazardRecords: 1589048,
      archiveVersions: ['2025-09-12'],
    },
    {
      areaCode: '41000',
      key: 'ksj-41-16-fixed-native-depth',
      label: '佐賀県・2015年の想定（KSJ 2016年度版）',
      referenceDate: null,
      modelYears: [2015],
      model:
        '南海トラフケース5・11、日本海F60、対馬海峡東・雲仙地溝の県独自断層による佐賀県の最大クラス津波',
      conditions:
        '地域海岸ごとに選定した最大クラスを悪条件下で計算した2015年設定の歴史版。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.saga.lg.jp/kiji00312186/3_12186_358275_up_13br4avn.pdf',
      historical: true,
      inputId: 'hazard-41',
      inputIds: ['hazard-41'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 ～ 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 1m未満',
        },
        {
          key: 'native-2',
          label: '1m以上 ～ 2m未満',
        },
        {
          key: 'native-3',
          label: '2m以上 ～ 5m未満',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '佐賀県の玄界灘・有明海沿岸。',
      coverageMunicipalities: null,
      hazardRecords: 58400,
      archiveVersions: ['16'],
    },
    {
      areaCode: '43000',
      key: 'ksj-43-22-fixed-native-depth',
      label: '熊本県・2013年の想定（KSJ 2022年度版）',
      referenceDate: null,
      modelYears: [2013],
      model:
        '雲仙地溝南縁断層帯、布田川・日奈久断層帯、南海トラフケース4・5・11の最大クラス津波',
      conditions:
        'KSJ 2022年版の歴史的ポリゴンを固定使用。2024年12月改訂の県解説を旧原典の証明に流用せず、国交省保存の県知事報告で照合。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.mlit.go.jp/river/shinngikai_blog/shaseishin/kasenbunkakai/bunkakai/dai50kai/siryou3-4.pdf',
      historical: true,
      inputId: 'hazard-43',
      inputIds: ['hazard-43'],
      bands: [
        {
          key: 'native-0',
          label: '0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 1.0m未満',
        },
        {
          key: 'native-2',
          label: '1.0m以上 ～ 2.0m未満',
        },
        {
          key: 'native-3',
          label: '2.0m以上 ～ 5.0m未満',
        },
        {
          key: 'native-4',
          label: '5.0m以上',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '熊本県の有明海・天草西・八代海の全沿岸。',
      coverageMunicipalities: null,
      hazardRecords: 53751,
      archiveVersions: ['22'],
    },
    {
      areaCode: '45000',
      key: 'ksj-45-23-fixed-native-depth',
      label: '宮崎県・2013・2020年の想定（KSJ 2023年度版）',
      referenceDate: null,
      modelYears: [2013, 2020],
      model:
        '南海トラフケース4・11と日向灘の県独自断層の3ケースを重ねた宮崎県の想定',
      conditions:
        'KSJ 2023統合版を使用。事前連絡が必要な旧20年・16年版は使用せず、2025年8月改定も反映しない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.miyazaki.lg.jp/kiki-kikikanri/kurashi/bosai/page00150.html',
      historical: true,
      inputId: 'hazard-45',
      inputIds: ['hazard-45'],
      bands: [
        {
          key: 'native-0',
          label: '～0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 1.0m未満',
        },
        {
          key: 'native-2',
          label: '1.0m以上 ～ 2.0m未満',
        },
        {
          key: 'native-3',
          label: '2.0m以上 ～ 5.0m未満',
        },
        {
          key: 'native-4',
          label: '5.0m以上 ～ 10.0m未満',
        },
        {
          key: 'native-5',
          label: '10.0m以上 ～ 20.0m未満',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '宮崎県全沿岸の2013年設定・2020年一部見直し。',
      coverageMunicipalities: null,
      hazardRecords: 76415,
      archiveVersions: ['23'],
    },
    {
      areaCode: '46000',
      key: 'ksj-46-20-fixed-native-depth',
      label: '鹿児島県・2014年の想定（KSJ 2020年度版）',
      referenceDate: null,
      modelYears: [2014],
      model:
        '南海トラフ・南西諸島海溝・県周辺断層から選んだ12ケースの最大クラス津波',
      conditions:
        '2014年9月24日公表想定を収録したKSJ 2020年版。旧16年版との最大値合成はしない。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.kagoshima.jp/ah07/bosai/sonae/sonae/documents/41671_20210329135921-1.pdf',
      historical: true,
      inputId: 'hazard-46',
      inputIds: ['hazard-46'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 ～ 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 1m未満',
        },
        {
          key: 'native-2',
          label: '1m以上 ～ 2m未満',
        },
        {
          key: 'native-3',
          label: '2m以上 ～ 3m未満',
        },
        {
          key: 'native-4',
          label: '3m以上 ～ 5m未満',
        },
        {
          key: 'native-5',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'native-6',
          label: '10m以上 ～ 20m未満',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '鹿児島県の本土・島しょを含む沿岸。',
      coverageMunicipalities: null,
      hazardRecords: 208287,
      archiveVersions: ['20'],
    },
    {
      areaCode: '47000',
      key: 'ksj-47-16-fixed-native-depth',
      label: '沖縄県・2015年の想定（KSJ 2016年度版）',
      referenceDate: null,
      modelYears: [2015],
      model: '沖縄県が2015年3月に法に基づき設定した最大クラス津波',
      conditions:
        '別途作成された2012年度津波浸水予測図は、法定想定より広い浸水面積を持つ場合がある。両者を混ぜずKSJ 2016年版の法定想定を使用。',
      pageUrl:
        'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
      methodUrl:
        'https://www.pref.okinawa.jp/_res/projects/default_project/_page_/001/020/541/kaisetu.pdf',
      historical: true,
      inputId: 'hazard-47',
      inputIds: ['hazard-47'],
      bands: [
        {
          key: 'native-0',
          label: '0.01m以上 ～ 0.3m未満',
        },
        {
          key: 'native-1',
          label: '0.3m以上 ～ 1m未満',
        },
        {
          key: 'native-2',
          label: '1m以上 ～ 2m未満',
        },
        {
          key: 'native-3',
          label: '2m以上 ～ 5m未満',
        },
        {
          key: 'native-4',
          label: '5m以上 ～ 10m未満',
        },
        {
          key: 'native-5',
          label: '10m以上 ～ 20m未満',
        },
        {
          key: 'native-6',
          label: '20m以上',
        },
        {
          key: 'not-in-positive-source',
          label: '採用原典の浸水ポリゴン非該当',
        },
      ],
      modelCoverage: '沖縄本島・周辺離島・宮古・八重山の沿岸。',
      coverageMunicipalities: null,
      hazardRecords: 135165,
      archiveVersions: ['16'],
    },
  ],
  notes: [
    '人口はKSJ 250mメッシュの2020年人口と2050年推計を格子中心で判定した近似です。被害人数や避難可能人数ではありません。',
    '秘匿・合算された人口を原典の配分先メッシュで集計するため、実際の居住地点に一致するとは限りません。',
    '施設は2022年4月の市町村役場等（行政施設1〜3）と公的集会施設（4〜5）です。津波避難施設や避難容量とは異なります。',
    '同じ原典内の重複は最大浸水深へ1回だけ算入。異なる県や版の想定を同じ地震として合計しません。',
    '原典の浸水区域外でも浸水が起こる可能性があります。未検証県を0へ変換しません。',
    '徳島はGRS80経緯度から原典JGD2000平面直角4系への投影で、測地系の時点間地殻変動補正を含みません。10m境界付近の判定には位置誤差の影響があります。',
    '浸水深区分は県ごとの原表区分です。1～3mを1～2mと2～3mへ推測配分しません。',
    '東京都の想定は島しょ11島です。本土等を0や浸水区域外へ置換せず、9町村内のポリゴン非該当にも未対象の島が含まれ得るため未判定として保持します。',
    '公表原典は固定版です。県が後に改定した想定や現在の避難情報は各県・市町村の公式情報を確認してください。',
  ],
  expectedCountyFactsSha256:
    '45ef674d1a41e04c629c3e850e4367d4eb5e675b5c0079c2f2ef1e08f0daa274',
  expectedIntermediates: [
    {
      areaCode: '01000',
      key: 'app/geo/tsunami-scenario-exposure/pref/01.json',
      sha256:
        'a639afb15457b9e227b9527f5502e39f53fb0bab24d7c67e661867a27c642101',
      bytes: 14154284,
    },
    {
      areaCode: '02000',
      key: 'app/geo/tsunami-scenario-exposure/pref/02.json',
      sha256:
        'c428ae334d385d73a4ae4ea9c8b387a924ab21bc7c61eb7aaf0b3e5709005f46',
      bytes: 3830480,
    },
    {
      areaCode: '03000',
      key: 'app/geo/tsunami-scenario-exposure/pref/03.json',
      sha256:
        'eb20cd17e5b645c4a2ef09a8821bdd6cb7d8e4cbff32b219311c772a1632e548',
      bytes: 7246683,
    },
    {
      areaCode: '04000',
      key: 'app/geo/tsunami-scenario-exposure/pref/04.json',
      sha256:
        '0c574f19f687c917dad55b801eabc5ab22423cf2a21e70a025ecf2d391980b7a',
      bytes: 5966042,
    },
    {
      areaCode: '05000',
      key: 'app/geo/tsunami-scenario-exposure/pref/05.json',
      sha256:
        'e4ae249626e360d6bd0dd8b2dd9fb4755517a9f3a5b30e89cf788eabb862b1c4',
      bytes: 4139483,
    },
    {
      areaCode: '06000',
      key: 'app/geo/tsunami-scenario-exposure/pref/06.json',
      sha256:
        'cd195117fb2f138f824162bfe8a38cc660bb83cfa6eb7e3c6520ba014e4d3a28',
      bytes: 3508024,
    },
    {
      areaCode: '07000',
      key: 'app/geo/tsunami-scenario-exposure/pref/07.json',
      sha256:
        'f983c01589717a3cf4e8e72a1a96b1f55385b3251d954ff1afdd9630bc359e1f',
      bytes: 7866498,
    },
    {
      areaCode: '08000',
      key: 'app/geo/tsunami-scenario-exposure/pref/08.json',
      sha256:
        '8414aa9be7291b8e3fc147ca62143d7cd4d410acceb3c9f520c3b714531e9206',
      bytes: 8824258,
    },
    {
      areaCode: '12000',
      key: 'app/geo/tsunami-scenario-exposure/pref/12.json',
      sha256:
        '8f40ea964d4d693a53bfa16bccf7ddb6a819a48b7658417c924ec8f5adc26f27',
      bytes: 8288991,
    },
    {
      areaCode: '13000',
      key: 'app/geo/tsunami-scenario-exposure/pref/13.json',
      sha256:
        'd8236e4e0ab8aeead5d6e53031a5e4c357af3e810f776b42b0192838a9620c09',
      bytes: 3911193,
    },
    {
      areaCode: '14000',
      key: 'app/geo/tsunami-scenario-exposure/pref/14.json',
      sha256:
        '416a097f0a20714becb4848b97fd2345310852fce31f519676443543c36076e5',
      bytes: 4076410,
    },
    {
      areaCode: '16000',
      key: 'app/geo/tsunami-scenario-exposure/pref/16.json',
      sha256:
        'e4ba6d49ddf4b9be81e4fcfc37033ebe0707eeb657438ea574e92202724b6670',
      bytes: 2994988,
    },
    {
      areaCode: '17000',
      key: 'app/geo/tsunami-scenario-exposure/pref/17.json',
      sha256:
        'dee028644d0c712f98442d8399befd1c02ace50f14f860e2d20cb92168598c4f',
      bytes: 2542562,
    },
    {
      areaCode: '18000',
      key: 'app/geo/tsunami-scenario-exposure/pref/18.json',
      sha256:
        'ffc83728a0bbc6441235203e1d15155cd7725ff2585b201b3184fc8551a6b120',
      bytes: 2001755,
    },
    {
      areaCode: '21000',
      key: 'app/geo/tsunami-scenario-exposure/pref/21.json',
      sha256:
        '4d6a7e78f9107493e6d09dd81ab7d2644ac0a7bf932a3df4a4590737868b03e0',
      bytes: 5207086,
    },
    {
      areaCode: '22000',
      key: 'app/geo/tsunami-scenario-exposure/pref/22.json',
      sha256:
        '57d9933d1e099f22e5b7168f435150bf87435e1e1b7b8932017c8545b94739eb',
      bytes: 6095141,
    },
    {
      areaCode: '23000',
      key: 'app/geo/tsunami-scenario-exposure/pref/23.json',
      sha256:
        '8cb0ccf6fbfd15c2aae1671750ed91f7f26bbd0feead6a29cdeb48250e0da340',
      bytes: 7201023,
    },
    {
      areaCode: '27000',
      key: 'app/geo/tsunami-scenario-exposure/pref/27.json',
      sha256:
        'd895776da3c8e5e4c1a09bcaca43ecac514a5f0ff100f0a14f3d1dc5d26ddbca',
      bytes: 3462280,
    },
    {
      areaCode: '28000',
      key: 'app/geo/tsunami-scenario-exposure/pref/28.json',
      sha256:
        '371ec3ccdeecea958d7d13d84399d6b1838ead3fbc1afc0ae03b9c9158d81452',
      bytes: 6952246,
    },
    {
      areaCode: '31000',
      key: 'app/geo/tsunami-scenario-exposure/pref/31.json',
      sha256:
        'ca154f2e3156f2e9f7a14b5d0bcad3bbb3b657b562069d66e7915d83a433f402',
      bytes: 1735016,
    },
    {
      areaCode: '32000',
      key: 'app/geo/tsunami-scenario-exposure/pref/32.json',
      sha256:
        '0fa0c92c1dfd88a3a4534046cd0633815873efc11bcd5df2d448de083c34c71f',
      bytes: 3934267,
    },
    {
      areaCode: '33000',
      key: 'app/geo/tsunami-scenario-exposure/pref/33.json',
      sha256:
        'a6658ca0e1080f7deb7d7db39a7b73df3c4140c0578623ce5647b30a4e703863',
      bytes: 5773230,
    },
    {
      areaCode: '35000',
      key: 'app/geo/tsunami-scenario-exposure/pref/35.json',
      sha256:
        '6c5e0a404a425398658d44692cf084997f9954a6b39321667e5b8e0eb6dea3bd',
      bytes: 4244448,
    },
    {
      areaCode: '36000',
      key: 'app/geo/tsunami-scenario-exposure/pref/36.json',
      sha256:
        '9ce6f3ad20d31b32b7629d126cfd1ffb21c3dcf08ace3f4728d5b742dabcbca5',
      bytes: 2570589,
    },
    {
      areaCode: '41000',
      key: 'app/geo/tsunami-scenario-exposure/pref/41.json',
      sha256:
        '2abe7be6748a90b16b171dd49cdf672a1d75f907d66c3fdb47ff89df776e0e09',
      bytes: 2513104,
    },
    {
      areaCode: '43000',
      key: 'app/geo/tsunami-scenario-exposure/pref/43.json',
      sha256:
        '7582ebdcdafd7c97395f8e4584c955063c78f6831d499cf29d537fef4973da6f',
      bytes: 5256605,
    },
    {
      areaCode: '45000',
      key: 'app/geo/tsunami-scenario-exposure/pref/45.json',
      sha256:
        '33376b47bc2f55759b9355d370db398fe75dd1aa5c491117f5d8230654138e16',
      bytes: 3726120,
    },
    {
      areaCode: '46000',
      key: 'app/geo/tsunami-scenario-exposure/pref/46.json',
      sha256:
        '53f3f94858e9940b7ff7995239ad9abba4aea73ac3b23ba8ceacfa1cf5ce3938',
      bytes: 6285488,
    },
    {
      areaCode: '47000',
      key: 'app/geo/tsunami-scenario-exposure/pref/47.json',
      sha256:
        '7646747a2ddb48d882342371161a2ad4e49112dc8f97db2bbfa7b5af137baf50',
      bytes: 1714452,
    },
  ],
} as const;
