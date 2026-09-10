import type { MetricConfig } from '../types';

export const regionalBusinessFinalEnergyConsumption: MetricConfig = {
  key: 'regional-business-final-energy-consumption',
  title: '業務他部門の最終エネルギー消費量',
  description:
    '都道府県別エネルギー消費統計の業務他（第三次産業）における直接利用分。',
  note: '2023年度の暫定値。原表のエネルギー単位表にある直接利用分の合計（TJ）を使用し、非エネルギー利用を含む。電力・熱の寄与損失を配分した総合計や炭素排出量とは異なる。対象は産業、業務他、家庭、運輸のうち家庭乗用車で、営業用輸送等を含む全国全体のエネルギー消費ではない。部門ごとに直接集計と按分推計を組み合わせている。公表一覧の調査年月は2024年度だが、使用する観測値は原表に明記された2023年度。業務他は第三次産業（650000）。運輸業・郵便業の事業所での消費と、家庭乗用車の走行分を区別する。',
  unit: 'TJ',
  category: 'energy',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '都道府県別エネルギー消費統計',
    url: 'https://www.e-stat.go.jp/stat-search/files?cycle=8&layout=datalist&page=1&result_page=1&tclass1=000001234683&tclass2val=0&toukei=00551006&toukei_kind=9&tstat=000001234682',
    config: {
      source: {
        name: '都道府県別エネルギー消費統計',
        url: 'https://www.e-stat.go.jp/stat-search/files?cycle=8&layout=datalist&page=1&result_page=1&tclass1=000001234683&tclass2val=0&toukei=00551006&toukei_kind=9&tstat=000001234682',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/files?cycle=8&layout=datalist&page=1&result_page=1&tclass1=000001234683&tclass2val=0&toukei=00551006&toukei_kind=9&tstat=000001234682',
        governmentStatisticsCode: '00551006',
        sourceUnit: 'TJ',
        releaseStatus: 'provisional',
        dataPeriodStart: '2023-04-01',
        dataPeriodEnd: '2024-03-31',
        catalogSurveyYearNotDataYear: '2024年度',
        sourceFiles: [
          {
            filename: 'energy-pref01.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397688&fileKind=4',
            sha256:
              '5201fb2e0b319a4fe8fb730bce16cfeff7e9cf5feb179c5557c7ac28566ad9fd',
            bytes: 1443555,
          },
          {
            filename: 'energy-pref02.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397689&fileKind=4',
            sha256:
              '197881eca2403f8c8c2c82319f1c96fad46fa74cb7f66cf5cea92ebd974497e8',
            bytes: 1413908,
          },
          {
            filename: 'energy-pref03.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397690&fileKind=4',
            sha256:
              '3ca023253b3d63d1e15adabbee96e7d30ba63c1e11a5c930e1356d92dd07e826',
            bytes: 1418055,
          },
          {
            filename: 'energy-pref04.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397691&fileKind=4',
            sha256:
              '1df730bfdce67ffda81357d8aba562d9ae49d39fe5e21e03c7bb3f666af20b42',
            bytes: 1430698,
          },
          {
            filename: 'energy-pref05.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397692&fileKind=4',
            sha256:
              '6368d4e4e42aabf3b62793542d9d82bbb592ffb16dc87c5d59b3d78d709b3354',
            bytes: 1414147,
          },
          {
            filename: 'energy-pref06.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397693&fileKind=4',
            sha256:
              '4940803bc8d6f021e56d741ddc7cf6f0ebfd4576d85788e66fcaa578693055c8',
            bytes: 1412517,
          },
          {
            filename: 'energy-pref07.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397694&fileKind=4',
            sha256:
              'a769b81026427aa1269bee227207958a86194ea019e0e97a95c3c9776761ff57',
            bytes: 1428611,
          },
          {
            filename: 'energy-pref08.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397695&fileKind=4',
            sha256:
              'c30a5f17f0a59e1676b3b9c2f72aeb239de8f35c541749c19b658f0cfb305804',
            bytes: 1447268,
          },
          {
            filename: 'energy-pref09.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397696&fileKind=4',
            sha256:
              'd5776cb427c34ab463ddd8a62be549866c2834d73f4a7bf28605bd9ffed06f04',
            bytes: 1432562,
          },
          {
            filename: 'energy-pref10.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397697&fileKind=4',
            sha256:
              '378ad593b410075aee2e64ddc0fdb98101a14466c859d0e116f59f42e38a4005',
            bytes: 1431023,
          },
          {
            filename: 'energy-pref11.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397698&fileKind=4',
            sha256:
              '47c210e1ea4c423f0b36439d9449e5942ee840bd5aef18c47e1503a4d8cb1cb1',
            bytes: 1446447,
          },
          {
            filename: 'energy-pref12.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397699&fileKind=4',
            sha256:
              'ec538433b8270a9739d71425b3094972fc00c5efe7c0a09b89bb912ddfb89368',
            bytes: 1454809,
          },
          {
            filename: 'energy-pref13.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397700&fileKind=4',
            sha256:
              '311a91ca4bcb14f9f21593edb649b40e2e11b3544b4c943501d5589c4bbe87f8',
            bytes: 1454347,
          },
          {
            filename: 'energy-pref14.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397701&fileKind=4',
            sha256:
              'ed40d82ef8cd63bb4cacb7edd65d74338d114db5cece995d65204e5c355f5da2',
            bytes: 1458241,
          },
          {
            filename: 'energy-pref15.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397702&fileKind=4',
            sha256:
              '0c65f888c65f6c499d9afdbbf6a81dabddbb0e8c06fa9b9e8da312a98f493bfa',
            bytes: 1423997,
          },
          {
            filename: 'energy-pref16.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397703&fileKind=4',
            sha256:
              'f691f01ba63b9a842ffd5ef0e2f8bcbb8d9c3734d34c802587a8a3d46e3b7d02',
            bytes: 1427671,
          },
          {
            filename: 'energy-pref17.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397704&fileKind=4',
            sha256:
              '00f3852355bfe073e79ee5eb0c9bba076b422c41026a9af5d1dde6d570feb5fe',
            bytes: 1425809,
          },
          {
            filename: 'energy-pref18.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397705&fileKind=4',
            sha256:
              '5f70e99151988a957b3e870cbb46f2c58e0e7fb70d5b86c2dd74d2d10d22ccc1',
            bytes: 1422156,
          },
          {
            filename: 'energy-pref19.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397706&fileKind=4',
            sha256:
              'c3dbeee1a3f2a962d7b72f97206ea7f69e898328a3314fc5e253972a540090de',
            bytes: 1403809,
          },
          {
            filename: 'energy-pref20.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397707&fileKind=4',
            sha256:
              '471b877039e5cb949581625906535331f84cdd1bb2e8ef4d8bd1e454665aad14',
            bytes: 1421131,
          },
          {
            filename: 'energy-pref21.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397708&fileKind=4',
            sha256:
              '6f7493907f00a14cd7f956032b45269fc660eb86d7bf2397ea26d64834d425ea',
            bytes: 1433169,
          },
          {
            filename: 'energy-pref22.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397709&fileKind=4',
            sha256:
              'a7d478728cea2e910591d18c6863e70e6ba20953446a3e8a836b02173d41028b',
            bytes: 1444638,
          },
          {
            filename: 'energy-pref23.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397710&fileKind=4',
            sha256:
              '689626caa01b72a9a4c548b34e5a36b1549c50a8b9a7f14ad949caeb9a9a2fe6',
            bytes: 1454345,
          },
          {
            filename: 'energy-pref24.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397711&fileKind=4',
            sha256:
              '35af66f3ea8892cb207cb668787bd98d8b4c1df4d4bc04b758e09895a0898357',
            bytes: 1434609,
          },
          {
            filename: 'energy-pref25.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397712&fileKind=4',
            sha256:
              '27e082326490494329b1a074170a671cd314d575ce8b33824df0f34bf40cfa0b',
            bytes: 1432527,
          },
          {
            filename: 'energy-pref26.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397713&fileKind=4',
            sha256:
              'e2fe4bd8344e8841ba6b073b5b2091a791f3b2172c99a5d39d05da5713b08001',
            bytes: 1436904,
          },
          {
            filename: 'energy-pref27.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397714&fileKind=4',
            sha256:
              'dedc7d1f0a71d95694a31282344ee071eda8290c3abd34f5a0e98001514ce114',
            bytes: 1457711,
          },
          {
            filename: 'energy-pref28.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397715&fileKind=4',
            sha256:
              '7c4cd5e1669d8eb6319fc5e39b79b3a62b67fdcc96c876875eceea31f8155c1a',
            bytes: 1449636,
          },
          {
            filename: 'energy-pref29.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397716&fileKind=4',
            sha256:
              '486a831ff7ebee12cc36251de6a25d925dd1c2eeddc6b2cd9df11cbc1f0b97e2',
            bytes: 1414209,
          },
          {
            filename: 'energy-pref30.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397717&fileKind=4',
            sha256:
              '255a979023df3a4e98ee76de33da71766ae23e69f5d027422b75752dfef08dbb',
            bytes: 1409000,
          },
          {
            filename: 'energy-pref31.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397718&fileKind=4',
            sha256:
              'bc4661206ae98ba245e27dab626d1a4a8d1f7b3c052320d2afdd8e33e9cb6fb9',
            bytes: 1388233,
          },
          {
            filename: 'energy-pref32.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397719&fileKind=4',
            sha256:
              '7130b05433d368e98ab1552120244e205d20552a0095949df17d4be76d74d641',
            bytes: 1405498,
          },
          {
            filename: 'energy-pref33.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397720&fileKind=4',
            sha256:
              '55163ece7e8a584809c756ea385410586b724ebc3b6b8411a3b21e5f8da9e30f',
            bytes: 1433724,
          },
          {
            filename: 'energy-pref34.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397721&fileKind=4',
            sha256:
              '9a13b66d87e5928eb1c2bed782b82dc54c7732fee91f5423c1b623f4a77bf999',
            bytes: 1426611,
          },
          {
            filename: 'energy-pref35.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397722&fileKind=4',
            sha256:
              '55afd6d60a499e64c8ffef626597872c2c89f5c133168d56238863db3cdd16c5',
            bytes: 1420019,
          },
          {
            filename: 'energy-pref36.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397723&fileKind=4',
            sha256:
              '6b369ddfdc29c80294704edb86f16e208dc070cc21f8d3cb8766d643e112fdd2',
            bytes: 1411307,
          },
          {
            filename: 'energy-pref37.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397724&fileKind=4',
            sha256:
              'a70acbb6009f304582422de049735304b4aebbeadf1530085397eec467756a4f',
            bytes: 1434469,
          },
          {
            filename: 'energy-pref38.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397725&fileKind=4',
            sha256:
              'f9ad6b41b8e5abcdc265847571b00e6ce5bc99d3d25c605cc47fd8edfa78a823',
            bytes: 1422197,
          },
          {
            filename: 'energy-pref39.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397726&fileKind=4',
            sha256:
              '6e99ea95d6d4838e3f341a578222d1aeda9632ca9a04c8285280a95dc1bb3a7f',
            bytes: 1398831,
          },
          {
            filename: 'energy-pref40.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397727&fileKind=4',
            sha256:
              '186b939d7d85edde6f25e1d2c86ed530b353895b35cf1f89176d6e546bdbc936',
            bytes: 1447061,
          },
          {
            filename: 'energy-pref41.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397728&fileKind=4',
            sha256:
              'c9a91c386be4ce63367cca0678cedcd05efb8c2189854232bf8a39b7897bd04a',
            bytes: 1413041,
          },
          {
            filename: 'energy-pref42.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397729&fileKind=4',
            sha256:
              '06a9b1d451b71223942f8b2e2f9399c303b2bc02bad9c086a23e96b8cee0d19b',
            bytes: 1410418,
          },
          {
            filename: 'energy-pref43.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397730&fileKind=4',
            sha256:
              '57af8ec2df366caa662b4e583d901151aa87fbf67e684d5626f69456d0e2b7cb',
            bytes: 1422783,
          },
          {
            filename: 'energy-pref44.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397731&fileKind=4',
            sha256:
              '7d96a12c59165782b2117328897166bec29b8e80fb44e7a4491e3325697d2ed8',
            bytes: 1420087,
          },
          {
            filename: 'energy-pref45.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397732&fileKind=4',
            sha256:
              '9ad1292cfa0674bb6b040f6a63af9c2edfea0d482ffeadd0f8eacebbeb9a79cd',
            bytes: 1412723,
          },
          {
            filename: 'energy-pref46.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397733&fileKind=4',
            sha256:
              'c1e95cedebe1805406311a82ea485a426586f7dce752ba799380ceeaa94e9f42',
            bytes: 1406440,
          },
          {
            filename: 'energy-pref47.xlsx',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397734&fileKind=4',
            sha256:
              'b05e595aeb4d0c1c6a79b271c7b254d70fe46b674ae245c109a649b554599e3d',
            bytes: 1395613,
          },
        ],
        definitionSources: [
          {
            filename: 'energy-cell-sources.pdf',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383483&fileKind=2',
            sha256:
              '5c153f1534f5c8750e90966a49a5638cba454f00bb652ec38e14d78116ffedd2',
            bytes: 913458,
          },
          {
            filename: 'energy-explanation.pdf',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383533&fileKind=2',
            sha256:
              '10045d4fe8eb10d170ed10a623107384abe9c620b927c7809e5adcb57b7c4b06',
            bytes: 149354,
          },
          {
            filename: 'energy-instructions.pdf',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383534&fileKind=2',
            sha256:
              'e207923f9cb7aaad5989201ee8415f63faa7b980266445d7f0e21eebd5d53539',
            bytes: 145218,
          },
          {
            filename: 'energy-revision-2024.pdf',
            url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383535&fileKind=2',
            sha256:
              '508513a27e242679d557da90b8985ef82a0c07736714281c0c7821afb9dd6bd8',
            bytes: 180418,
          },
        ],
        table: '各県23FYシート エネルギー単位表 直接利用分合計',
        valueColumn: 'V列・code900。対象行コード 650000',
        sourceRowCodes: [650000],
        denominator: null,
        formula: '650000',
        geography: '各県に直接集計または指標按分で帰属させた推計消費量',
        scope:
          '農林水産鉱建設業・製造業・業務他・家庭・家庭乗用車。非エネルギー利用を含む直接消費。',
        nationalComparison:
          '公式独立全国集計表はなし。47県同一範囲の部門合算と原表最終消費合算を検算。全国の全運輸を含む総合エネルギー統計とは範囲が異なる。',
        verification:
          '47県の期日・地理・単位・コードを固定し、部門合計、エネルギー/非エネルギー分解、直計時系列シートの2023列を照合。47県4部門合計10954384.953554085TJ。欠測0。',
        dataYear: '2023年度（暫定値）',
        accessedAt: '2026-09-10',
        extraction:
          '公式原表SHAを固定し、対象列・期間・県・分母を確認して抽出。欠測を0に変換しない。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-energy-gender.mjs --write-local',
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2023,
    to: 2023,
  },
  yearFormat: 'fiscal',
  display: {
    conversionFactor: 1,
    decimalPlaces: 1,
  },
  isActive: true,
};
