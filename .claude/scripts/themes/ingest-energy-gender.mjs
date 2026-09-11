#!/usr/bin/env node
/** Pinned prefectural energy and gender sources. R2 writes require --write-local. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
export const SOURCES = [
  {
    filename: 'energy-pref01.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397688&fileKind=4',
    sha256: '5201fb2e0b319a4fe8fb730bce16cfeff7e9cf5feb179c5557c7ac28566ad9fd',
    bytes: 1443555,
  },
  {
    filename: 'energy-pref02.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397689&fileKind=4',
    sha256: '197881eca2403f8c8c2c82319f1c96fad46fa74cb7f66cf5cea92ebd974497e8',
    bytes: 1413908,
  },
  {
    filename: 'energy-pref03.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397690&fileKind=4',
    sha256: '3ca023253b3d63d1e15adabbee96e7d30ba63c1e11a5c930e1356d92dd07e826',
    bytes: 1418055,
  },
  {
    filename: 'energy-pref04.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397691&fileKind=4',
    sha256: '1df730bfdce67ffda81357d8aba562d9ae49d39fe5e21e03c7bb3f666af20b42',
    bytes: 1430698,
  },
  {
    filename: 'energy-pref05.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397692&fileKind=4',
    sha256: '6368d4e4e42aabf3b62793542d9d82bbb592ffb16dc87c5d59b3d78d709b3354',
    bytes: 1414147,
  },
  {
    filename: 'energy-pref06.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397693&fileKind=4',
    sha256: '4940803bc8d6f021e56d741ddc7cf6f0ebfd4576d85788e66fcaa578693055c8',
    bytes: 1412517,
  },
  {
    filename: 'energy-pref07.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397694&fileKind=4',
    sha256: 'a769b81026427aa1269bee227207958a86194ea019e0e97a95c3c9776761ff57',
    bytes: 1428611,
  },
  {
    filename: 'energy-pref08.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397695&fileKind=4',
    sha256: 'c30a5f17f0a59e1676b3b9c2f72aeb239de8f35c541749c19b658f0cfb305804',
    bytes: 1447268,
  },
  {
    filename: 'energy-pref09.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397696&fileKind=4',
    sha256: 'd5776cb427c34ab463ddd8a62be549866c2834d73f4a7bf28605bd9ffed06f04',
    bytes: 1432562,
  },
  {
    filename: 'energy-pref10.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397697&fileKind=4',
    sha256: '378ad593b410075aee2e64ddc0fdb98101a14466c859d0e116f59f42e38a4005',
    bytes: 1431023,
  },
  {
    filename: 'energy-pref11.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397698&fileKind=4',
    sha256: '47c210e1ea4c423f0b36439d9449e5942ee840bd5aef18c47e1503a4d8cb1cb1',
    bytes: 1446447,
  },
  {
    filename: 'energy-pref12.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397699&fileKind=4',
    sha256: 'ec538433b8270a9739d71425b3094972fc00c5efe7c0a09b89bb912ddfb89368',
    bytes: 1454809,
  },
  {
    filename: 'energy-pref13.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397700&fileKind=4',
    sha256: '311a91ca4bcb14f9f21593edb649b40e2e11b3544b4c943501d5589c4bbe87f8',
    bytes: 1454347,
  },
  {
    filename: 'energy-pref14.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397701&fileKind=4',
    sha256: 'ed40d82ef8cd63bb4cacb7edd65d74338d114db5cece995d65204e5c355f5da2',
    bytes: 1458241,
  },
  {
    filename: 'energy-pref15.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397702&fileKind=4',
    sha256: '0c65f888c65f6c499d9afdbbf6a81dabddbb0e8c06fa9b9e8da312a98f493bfa',
    bytes: 1423997,
  },
  {
    filename: 'energy-pref16.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397703&fileKind=4',
    sha256: 'f691f01ba63b9a842ffd5ef0e2f8bcbb8d9c3734d34c802587a8a3d46e3b7d02',
    bytes: 1427671,
  },
  {
    filename: 'energy-pref17.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397704&fileKind=4',
    sha256: '00f3852355bfe073e79ee5eb0c9bba076b422c41026a9af5d1dde6d570feb5fe',
    bytes: 1425809,
  },
  {
    filename: 'energy-pref18.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397705&fileKind=4',
    sha256: '5f70e99151988a957b3e870cbb46f2c58e0e7fb70d5b86c2dd74d2d10d22ccc1',
    bytes: 1422156,
  },
  {
    filename: 'energy-pref19.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397706&fileKind=4',
    sha256: 'c3dbeee1a3f2a962d7b72f97206ea7f69e898328a3314fc5e253972a540090de',
    bytes: 1403809,
  },
  {
    filename: 'energy-pref20.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397707&fileKind=4',
    sha256: '471b877039e5cb949581625906535331f84cdd1bb2e8ef4d8bd1e454665aad14',
    bytes: 1421131,
  },
  {
    filename: 'energy-pref21.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397708&fileKind=4',
    sha256: '6f7493907f00a14cd7f956032b45269fc660eb86d7bf2397ea26d64834d425ea',
    bytes: 1433169,
  },
  {
    filename: 'energy-pref22.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397709&fileKind=4',
    sha256: 'a7d478728cea2e910591d18c6863e70e6ba20953446a3e8a836b02173d41028b',
    bytes: 1444638,
  },
  {
    filename: 'energy-pref23.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397710&fileKind=4',
    sha256: '689626caa01b72a9a4c548b34e5a36b1549c50a8b9a7f14ad949caeb9a9a2fe6',
    bytes: 1454345,
  },
  {
    filename: 'energy-pref24.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397711&fileKind=4',
    sha256: '35af66f3ea8892cb207cb668787bd98d8b4c1df4d4bc04b758e09895a0898357',
    bytes: 1434609,
  },
  {
    filename: 'energy-pref25.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397712&fileKind=4',
    sha256: '27e082326490494329b1a074170a671cd314d575ce8b33824df0f34bf40cfa0b',
    bytes: 1432527,
  },
  {
    filename: 'energy-pref26.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397713&fileKind=4',
    sha256: 'e2fe4bd8344e8841ba6b073b5b2091a791f3b2172c99a5d39d05da5713b08001',
    bytes: 1436904,
  },
  {
    filename: 'energy-pref27.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397714&fileKind=4',
    sha256: 'dedc7d1f0a71d95694a31282344ee071eda8290c3abd34f5a0e98001514ce114',
    bytes: 1457711,
  },
  {
    filename: 'energy-pref28.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397715&fileKind=4',
    sha256: '7c4cd5e1669d8eb6319fc5e39b79b3a62b67fdcc96c876875eceea31f8155c1a',
    bytes: 1449636,
  },
  {
    filename: 'energy-pref29.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397716&fileKind=4',
    sha256: '486a831ff7ebee12cc36251de6a25d925dd1c2eeddc6b2cd9df11cbc1f0b97e2',
    bytes: 1414209,
  },
  {
    filename: 'energy-pref30.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397717&fileKind=4',
    sha256: '255a979023df3a4e98ee76de33da71766ae23e69f5d027422b75752dfef08dbb',
    bytes: 1409000,
  },
  {
    filename: 'energy-pref31.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397718&fileKind=4',
    sha256: 'bc4661206ae98ba245e27dab626d1a4a8d1f7b3c052320d2afdd8e33e9cb6fb9',
    bytes: 1388233,
  },
  {
    filename: 'energy-pref32.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397719&fileKind=4',
    sha256: '7130b05433d368e98ab1552120244e205d20552a0095949df17d4be76d74d641',
    bytes: 1405498,
  },
  {
    filename: 'energy-pref33.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397720&fileKind=4',
    sha256: '55163ece7e8a584809c756ea385410586b724ebc3b6b8411a3b21e5f8da9e30f',
    bytes: 1433724,
  },
  {
    filename: 'energy-pref34.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397721&fileKind=4',
    sha256: '9a13b66d87e5928eb1c2bed782b82dc54c7732fee91f5423c1b623f4a77bf999',
    bytes: 1426611,
  },
  {
    filename: 'energy-pref35.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397722&fileKind=4',
    sha256: '55afd6d60a499e64c8ffef626597872c2c89f5c133168d56238863db3cdd16c5',
    bytes: 1420019,
  },
  {
    filename: 'energy-pref36.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397723&fileKind=4',
    sha256: '6b369ddfdc29c80294704edb86f16e208dc070cc21f8d3cb8766d643e112fdd2',
    bytes: 1411307,
  },
  {
    filename: 'energy-pref37.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397724&fileKind=4',
    sha256: 'a70acbb6009f304582422de049735304b4aebbeadf1530085397eec467756a4f',
    bytes: 1434469,
  },
  {
    filename: 'energy-pref38.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397725&fileKind=4',
    sha256: 'f9ad6b41b8e5abcdc265847571b00e6ce5bc99d3d25c605cc47fd8edfa78a823',
    bytes: 1422197,
  },
  {
    filename: 'energy-pref39.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397726&fileKind=4',
    sha256: '6e99ea95d6d4838e3f341a578222d1aeda9632ca9a04c8285280a95dc1bb3a7f',
    bytes: 1398831,
  },
  {
    filename: 'energy-pref40.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397727&fileKind=4',
    sha256: '186b939d7d85edde6f25e1d2c86ed530b353895b35cf1f89176d6e546bdbc936',
    bytes: 1447061,
  },
  {
    filename: 'energy-pref41.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397728&fileKind=4',
    sha256: 'c9a91c386be4ce63367cca0678cedcd05efb8c2189854232bf8a39b7897bd04a',
    bytes: 1413041,
  },
  {
    filename: 'energy-pref42.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397729&fileKind=4',
    sha256: '06a9b1d451b71223942f8b2e2f9399c303b2bc02bad9c086a23e96b8cee0d19b',
    bytes: 1410418,
  },
  {
    filename: 'energy-pref43.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397730&fileKind=4',
    sha256: '57af8ec2df366caa662b4e583d901151aa87fbf67e684d5626f69456d0e2b7cb',
    bytes: 1422783,
  },
  {
    filename: 'energy-pref44.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397731&fileKind=4',
    sha256: '7d96a12c59165782b2117328897166bec29b8e80fb44e7a4491e3325697d2ed8',
    bytes: 1420087,
  },
  {
    filename: 'energy-pref45.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397732&fileKind=4',
    sha256: '9ad1292cfa0674bb6b040f6a63af9c2edfea0d482ffeadd0f8eacebbeb9a79cd',
    bytes: 1412723,
  },
  {
    filename: 'energy-pref46.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397733&fileKind=4',
    sha256: 'c1e95cedebe1805406311a82ea485a426586f7dce752ba799380ceeaa94e9f42',
    bytes: 1406440,
  },
  {
    filename: 'energy-pref47.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040397734&fileKind=4',
    sha256: 'b05e595aeb4d0c1c6a79b271c7b254d70fe46b674ae245c109a649b554599e3d',
    bytes: 1395613,
  },
  {
    filename: 'energy-cell-sources.pdf',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383483&fileKind=2',
    sha256: '5c153f1534f5c8750e90966a49a5638cba454f00bb652ec38e14d78116ffedd2',
    bytes: 913458,
  },
  {
    filename: 'energy-explanation.pdf',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383533&fileKind=2',
    sha256: '10045d4fe8eb10d170ed10a623107384abe9c620b927c7809e5adcb57b7c4b06',
    bytes: 149354,
  },
  {
    filename: 'energy-instructions.pdf',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383534&fileKind=2',
    sha256: 'e207923f9cb7aaad5989201ee8415f63faa7b980266445d7f0e21eebd5d53539',
    bytes: 145218,
  },
  {
    filename: 'energy-revision-2024.pdf',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383535&fileKind=2',
    sha256: '508513a27e242679d557da90b8985ef82a0c07736714281c0c7821afb9dd6bd8',
    bytes: 180418,
  },
  {
    filename: 'gender-index.html',
    url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/report.html',
    sha256: '233e4c5c2ae276f39c94e2b6b6e8d8a623f7df4c4fb8f1c9fba9f8b220461ae7',
    bytes: 23243,
  },
  {
    filename: 'gender-managers.pdf',
    url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/05-1.pdf',
    sha256: '0220a8468e5fd3f5fcf35633a55cbd11d3e1fedc499fb3598cf71a02b00ffc6b',
    bytes: 524308,
  },
  {
    filename: 'gender-councillors.pdf',
    url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/21-1.pdf',
    sha256: 'cae9de08cf01567f7abbc094f6fb3fe9bab035889ed0f306f6895d3d3cc89076',
    bytes: 139484,
  },
];
export const FIELDS = [
  {
    key: 'regional-industry-final-energy-consumption',
    title: '産業部門の最終エネルギー消費量',
    column: 0,
    codes: [610000, 620000],
    family: 'energy',
    unit: 'TJ',
    year: 2023,
    yearFormat: 'fiscal',
    yearName: '2023年度（暫定値）',
    decimalPlaces: 1,
    category: 'energy',
  },
  {
    key: 'regional-business-final-energy-consumption',
    title: '業務他部門の最終エネルギー消費量',
    column: 1,
    codes: [650000],
    family: 'energy',
    unit: 'TJ',
    year: 2023,
    yearFormat: 'fiscal',
    yearName: '2023年度（暫定値）',
    decimalPlaces: 1,
    category: 'energy',
  },
  {
    key: 'regional-household-final-energy-consumption',
    title: '家庭部門の最終エネルギー消費量',
    column: 2,
    codes: [700000],
    family: 'energy',
    unit: 'TJ',
    year: 2023,
    yearFormat: 'fiscal',
    yearName: '2023年度（暫定値）',
    decimalPlaces: 1,
    category: 'energy',
  },
  {
    key: 'regional-household-car-final-energy-consumption',
    title: '家庭乗用車の最終エネルギー消費量',
    column: 3,
    codes: [800000],
    family: 'energy',
    unit: 'TJ',
    year: 2023,
    yearFormat: 'fiscal',
    yearName: '2023年度（暫定値）',
    decimalPlaces: 1,
    category: 'energy',
  },
  {
    key: 'prefectural-manager-female-share',
    title: '都道府県の管理職に占める女性の割合',
    family: 'manager',
    unit: '%',
    column: 2,
    year: 2025,
    yearFormat: 'calendar',
    yearName: '原則2025年4月1日現在',
    decimalPlaces: 1,
    category: 'administrativefinancial',
  },
  {
    key: 'prefectural-assembly-female-share',
    title: '都道府県議会議員に占める女性の割合',
    family: 'councillor',
    unit: '%',
    column: 2,
    year: 2024,
    yearFormat: 'calendar',
    yearName: '2024年12月31日現在',
    decimalPlaces: 1,
    category: 'administrativefinancial',
  },
];
export const EXPECTED_SOURCES = {
  'regional-industry-final-energy-consumption': {
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
        valueColumn: 'V列・code900。対象行コード 610000+620000',
        sourceRowCodes: [610000, 620000],
        denominator: null,
        formula: '610000 + 620000',
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
  'regional-business-final-energy-consumption': {
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
  'regional-household-final-energy-consumption': {
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
        valueColumn: 'V列・code900。対象行コード 700000',
        sourceRowCodes: [700000],
        denominator: null,
        formula: '700000',
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
  'regional-household-car-final-energy-consumption': {
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
        valueColumn: 'V列・code900。対象行コード 800000',
        sourceRowCodes: [800000],
        denominator: null,
        formula: '800000',
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
  'prefectural-manager-female-share': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName:
      '地方公共団体における男女共同参画社会の形成又は女性に関する施策の推進状況',
    url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/05-1.pdf',
    config: {
      source: {
        name: '地方公共団体における男女共同参画社会の形成又は女性に関する施策の推進状況',
        url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/05-1.pdf',
      },
      provenance: {
        url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/05-1.pdf',
        sourceSha256:
          '0220a8468e5fd3f5fcf35633a55cbd11d3e1fedc499fb3598cf71a02b00ffc6b',
        publicationIndexUrl:
          'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/report.html',
        publicationIndexSha256:
          '233e4c5c2ae276f39c94e2b6b6e8d8a623f7df4c4fb8f1c9fba9f8b220461ae7',
        published: '2026-05',
        sourceUnit: '%',
        table: '表5-1 全体 管理職総数（部局長・次長・課長相当職）',
        pdfPage: 1,
        valueColumn:
          '数値0起算列0=分母、1=女性人数、2=女性比率。47県と最初の計のみ。',
        asOf: '2025-04-01 (原則・自治体により異なる場合あり)',
        denominator:
          '都道府県職員の部局長・次長相当職+課長相当職の総数。教職員を除く。',
        geography: '都道府県の機関。指定都市及び市区町村を除外。',
        formula: '女性人数 / 同じ表の対象総数 * 100 の公表小数1桁値を保持',
        verification:
          '47県の12計数列sumと全国県計が全一致。6比率を各県・県計で人数から検算（丸め0.05pt以内）。対象37711人、女性5740人、公表15.2%。',
        dataYear: '原則2025年4月1日現在',
        accessedAt: '2026-09-10',
        extraction:
          '公式原表SHAを固定し、対象列・期間・県・分母を確認して抽出。欠測を0に変換しない。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-energy-gender.mjs --write-local',
      },
    },
  },
  'prefectural-assembly-female-share': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName:
      '地方公共団体における男女共同参画社会の形成又は女性に関する施策の推進状況',
    url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/21-1.pdf',
    config: {
      source: {
        name: '地方公共団体における男女共同参画社会の形成又は女性に関する施策の推進状況',
        url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/21-1.pdf',
      },
      provenance: {
        url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/21-1.pdf',
        sourceSha256:
          'cae9de08cf01567f7abbc094f6fb3fe9bab035889ed0f306f6895d3d3cc89076',
        publicationIndexUrl:
          'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/report.html',
        publicationIndexSha256:
          '233e4c5c2ae276f39c94e2b6b6e8d8a623f7df4c4fb8f1c9fba9f8b220461ae7',
        published: '2026-05',
        sourceUnit: '%',
        table: '参考1 地方議会における女性議員の状況 都道府県議会',
        pdfPage: 1,
        valueColumn:
          '数値0起算列0=分母、1=女性人数、2=女性比率。47県と最初の計のみ。',
        asOf: '2024-12-31',
        denominator: '都道府県議会議員の現員数（定数ではない）。',
        geography: '都道府県の機関。指定都市及び市区町村を除外。',
        formula: '女性人数 / 同じ表の対象総数 * 100 の公表小数1桁値を保持',
        verification:
          '47県の6計数列sumと県計が全一致。3比率を各県・県計で人数から検算（丸め0.05pt以内）。県議会現員2614人、女性382人、公表14.6%。',
        dataYear: '2024年12月31日現在',
        accessedAt: '2026-09-10',
        extraction:
          '公式原表SHAを固定し、対象列・期間・県・分母を確認して抽出。欠測を0に変換しない。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-energy-gender.mjs --write-local',
      },
    },
  },
};
const require = createRequire(import.meta.url);
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const {
  parseStatsValuesPayload,
} = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const clean = (s) => String(s).replace(/\s+/g, '');
export const sha = (b) => createHash('sha256').update(b).digest('hex');
export function assertHash(b, expected) {
  assert.equal(sha(b), expected, 'official source SHA');
}
export function number(x) {
  assert.ok(typeof x === 'number' || typeof x === 'string', 'missing value');
  const t = String(x).replaceAll(',', '');
  assert.match(
    t,
    /^\d+(?:\.\d+)?$/,
    'nonnegative numeric value, no missing imputation'
  );
  const n = Number(t);
  assert.ok(Number.isFinite(n) && n >= 0);
  return n;
}
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const byName = (name) => {
  const p = prefectures.find((p) => p.prefName === name);
  assert.ok(p, 'known prefecture ' + name);
  return { areaCode: p.prefCode, areaName: p.prefName };
};
export function requirePrefectures(rows) {
  assert.equal(rows.length, 47);
  assert.deepEqual(
    rows.map((r) => r.areaCode).sort(),
    prefectures.map((p) => p.prefCode).sort(),
    'unique 47 prefectures'
  );
  rows.forEach((r) =>
    assert.deepEqual(byName(r.areaName), {
      areaCode: r.areaCode,
      areaName: r.areaName,
    })
  );
}
export function near(actual, expected, label) {
  assert.ok(
    Math.abs(actual - expected) <= Math.max(1e-7, Math.abs(expected) * 1e-10),
    label + ' conservation'
  );
}
export function pdfText(b, page) {
  return execFileSync(
    'pdftotext',
    [
      ...(page ? ['-f', String(page), '-l', String(page)] : []),
      '-layout',
      '-',
      '-',
    ],
    { input: b, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
  );
}
export function parseGender(page, kind) {
  assert.ok(kind === 'manager' || kind === 'councillor');
  const flat = clean(page);
  const tokens =
    kind === 'manager'
      ? [
          '５－１公務員の各役職段階に占める女性の割合',
          '全体',
          '部局長',
          '課長',
          '教職員以外',
          '2025年４月１日',
          '事情により異なる',
        ]
      : [
          '地方議会における女性議員の状況',
          '都道府県議会',
          '現員数',
          '総務省資料',
          '2024年12月31日現在',
        ];
  for (const t of tokens) assert.ok(flat.includes(t), 'gender scope ' + t);
  const rows = [];
  let national = null;
  for (const line of page.split('\n')) {
    const match = line.match(/^([^\d]+?)\s+(\d.*)$/);
    if (!match) continue;
    const name = clean(match[1]);
    if (
      !prefectures.some((p) => p.prefName === name) &&
      !(name === '計' && national === null)
    )
      continue;
    const values = match[2].trim().split(/\s+/).map(number);
    assert.equal(
      values.length,
      kind === 'manager' ? 18 : 9,
      'gender source columns'
    );
    for (let i = 0; i < values.length; i += 3) {
      assert.ok(
        Number.isSafeInteger(values[i]) && values[i] > 0,
        'positive denominator'
      );
      assert.ok(
        Number.isSafeInteger(values[i + 1]) && values[i + 1] <= values[i],
        'female numerator'
      );
      assert.ok(
        Math.abs((values[i + 1] / values[i]) * 100 - values[i + 2]) <= 0.05001,
        'published one-decimal ratio'
      );
    }
    if (kind === 'manager') {
      for (const start of [0, 9]) {
        assert.equal(
          values[start],
          values[start + 3] + values[start + 6],
          'manager ranks total'
        );
        assert.equal(
          values[start + 1],
          values[start + 4] + values[start + 7],
          'female manager ranks total'
        );
      }
      for (let i = 0; i < 9; i++)
        if (i % 3 !== 2)
          assert.ok(
            values[i] >= values[i + 9],
            'general administration is subset'
          );
    }
    const r = {
      ...(name === '計'
        ? { areaCode: '00000', areaName: '都道府県計' }
        : byName(name)),
      values,
    };
    if (name === '計') national = r;
    else rows.push(r);
  }
  requirePrefectures(rows);
  assert.ok(national);
  assert.deepEqual(
    national.values,
    kind === 'manager'
      ? [
          37711, 5740, 15.2, 7922, 814, 10.3, 29789, 4926, 16.5, 25109, 4050,
          16.1, 4822, 598, 12.4, 20287, 3452, 17.0,
        ]
      : [2614, 382, 14.6, 18389, 3732, 20.3, 10551, 1492, 14.1],
    'official prefectural-only total'
  );
  for (let i = 0; i < national.values.length; i++)
    if (i % 3 !== 2)
      assert.equal(
        sum(rows.map((r) => r.values[i])),
        national.values[i],
        '47-county count sum'
      );
  return {
    rows,
    national,
    checks: {
      prefectures: 47,
      missing: 0,
      pdfPage: 1,
      countColumns: kind === 'manager' ? 12 : 6,
      ratioChecks: kind === 'manager' ? 288 : 144,
      denominatorColumn: 0,
      femaleColumn: 1,
      ratioColumn: 2,
      excludedDesignatedCities: true,
      asOf:
        kind === 'manager'
          ? '原則2025-04-01（自治体事情による相違あり）'
          : '2024-12-31',
      ratioRoundingTolerancePercentagePoints: 0.05001,
    },
  };
}
export const ENERGY_ROWS = [
  { code: 500000, row: 82, name: '最終エネルギー消費' },
  { code: 600000, row: 84, name: '企業･事業所他' },
  { code: 610000, row: 86, name: '農林水産鉱建設業' },
  { code: 620000, row: 90, name: '製造業' },
  { code: 650000, row: 103, name: '業務他(第三次産業)' },
  { code: 700000, row: 120, name: '家庭' },
  { code: 800000, row: 122, name: '運輸' },
];
// Source-specific XLSX reader: Python standard library only; cached formula values,
// shared strings and the two named sheets are read, never evaluated or rewritten.
export function readEnergyWorkbook(sourcePath, expectedSha256) {
  const python = String.raw`
import hashlib,io,json,posixpath,sys,zipfile,xml.etree.ElementTree as ET
M='{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
R='{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
source=open(sys.argv[1],'rb').read()
assert hashlib.sha256(source).hexdigest()==sys.argv[2], 'source SHA before selective read'
with zipfile.ZipFile(io.BytesIO(source)) as z:
    wb=ET.fromstring(z.read('xl/workbook.xml'))
    rels={r.attrib['Id']:r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    strings=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        strings=[''.join(t.text or '' for t in si.iter(M+'t')) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
    sheets={}
    for s in wb.find(M+'sheets'):
        name=s.attrib['name']
        if name not in ['23FY','直計']:continue
        assert name not in sheets
        target=rels[s.attrib[R+'id']]
        path=posixpath.normpath(target.lstrip('/') if target.startswith('/') else posixpath.join('xl',target))
        assert path.startswith('xl/worksheets/')
        cells={}
        for row in ET.fromstring(z.read(path)).find(M+'sheetData'):
            for c in row:
                addr=c.attrib['r'];assert addr not in cells
                v=c.find(M+'v');value=None;kind=c.attrib.get('t')
                if kind=='inlineStr':value=''.join(t.text or '' for t in c.iter(M+'t'))
                elif v is not None and v.text is not None:
                    raw=v.text
                    if kind=='s':value=strings[int(raw)]
                    elif kind in ['str','e']:value=raw
                    elif kind=='b':value=(raw=='1')
                    else:value=float(raw)
                cells[addr]=value
        sheets[name]=cells
    assert set(sheets)=={'23FY','直計'}
    print(json.dumps(sheets,ensure_ascii=False,allow_nan=False))
`;
  const sheets = JSON.parse(
    execFileSync('python3', ['-c', python, sourcePath, expectedSha256], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 2 * 1024 * 1024,
    })
  );
  return {
    getWorksheet(name) {
      const cells = sheets[name];
      return cells
        ? {
            getCell(address) {
              return { value: cells[address] ?? null };
            },
          }
        : undefined;
    },
  };
}

function cell(sheet, address) {
  const v = sheet.getCell(address).value;
  if (v && typeof v === 'object' && ('formula' in v || 'sharedFormula' in v))
    return v.result;
  return v;
}
export function parseEnergyWorkbook(w, area) {
  assert.deepEqual(byName(area.areaName), area);
  const s = w.getWorksheet('23FY'),
    t = w.getWorksheet('直計');
  assert.ok(s && t, '2023 source sheets');
  for (const addr of ['A69', 'A79'])
    assert.equal(
      cell(s, addr),
      '2023FY 暫定値',
      'observation year and provisional status'
    );
  assert.equal(clean(cell(s, 'D75')), '<<ｴﾈﾙｷﾞｰ単位表>>');
  assert.equal(cell(s, 'V69'), 900);
  assert.equal(cell(s, 'V79'), 'TJ');
  assert.equal(cell(s, 'AB69'), 999);
  assert.equal(clean(cell(s, 'V78')), '合計');
  const sourceName =
    area.areaCode === '01000' ? area.areaName : area.areaName.slice(0, -1);
  assert.equal(clean(cell(s, 'A72')), sourceName, 'prefecture short name');
  assert.equal(cell(t, 'Y1'), 2023);
  assert.equal(cell(t, 'Y11'), 'TJ');
  assert.equal(clean(cell(t, 'Y5')), sourceName);
  assert.equal(cell(t, 'A1'), '直接利用分合計');
  const direct = {},
    nonEnergy = {};
  for (const r of ENERGY_ROWS) {
    assert.equal(cell(s, 'A' + r.row), r.code);
    assert.equal(clean(cell(s, 'D' + r.row)), r.name);
    const value = number(cell(s, 'V' + r.row));
    direct[r.code] = value;
    nonEnergy[r.code] = number(cell(s, 'X' + r.row));
    near(
      value,
      number(cell(s, 'W' + r.row)) + nonEnergy[r.code],
      'energy + non-energy'
    );
    assert.equal(cell(t, 'A' + (r.row - 68)), r.code);
    near(
      value,
      number(cell(t, 'Y' + (r.row - 68))),
      'independent direct time-series sheet'
    );
  }
  near(
    direct[500000],
    direct[600000] + direct[700000] + direct[800000],
    'top sector sum'
  );
  near(
    direct[600000],
    direct[610000] + direct[620000] + direct[650000],
    'enterprise sector sum'
  );
  assert.equal(cell(s, 'A123'), 810000);
  assert.equal(cell(s, 'A124'), 811000);
  near(direct[800000], number(cell(s, 'V123')), 'transport == passengers');
  near(direct[800000], number(cell(s, 'V124')), 'transport == household cars');
  return {
    ...area,
    values: [
      direct[610000] + direct[620000],
      direct[650000],
      direct[700000],
      direct[800000],
    ],
    direct,
    nonEnergy,
    scopeTotal: direct[500000],
  };
}
export function validateEnergyDefinitions(side, top, method, cellSources) {
  for (const token of [
    '最終エネルギー消費',
    '500000',
    '=600000+700000+800000',
    '企業･事業所他',
    '600000',
    '=610000+620000+650000',
    '乗用車',
    '811000',
  ])
    assert.ok(clean(side).includes(token), 'energy row definition ' + token);
  for (const token of [
    '合計',
    '900',
    '非エネルギー利用',
    '920',
    '電力･熱配分後消費･排出量',
    '999',
  ])
    assert.ok(clean(top).includes(token), 'energy column definition ' + token);
  for (const token of [
    '都道府県別エネルギー消費統計',
    '家計調査のガソリン購入数量',
    '従業者数で按分',
    '自家発電',
  ])
    assert.ok(clean(method).includes(token), 'energy estimator scope ' + token);
  assert.ok(clean(cellSources).includes('統計表のセルと一次統計の対応表'));
}
export function combineEnergy(rows) {
  requirePrefectures(rows);
  const values = FIELDS.filter((f) => f.family === 'energy').map((f, i) =>
      sum(rows.map((r) => r.values[i]))
    ),
    scopeTotal = sum(rows.map((r) => r.scopeTotal));
  near(sum(values), scopeTotal, '47-county overall sectors');
  return {
    rows,
    derivedPrefectureTotal: {
      values,
      scopeTotal,
      officialNationalAggregate: false,
      label: '対象47都道府県の合計',
    },
    checks: {
      prefectures: 47,
      missing: 0,
      year: 2023,
      releaseStatus: 'provisional',
      unit: 'TJ',
      table: '23FY エネルギー単位表',
      column: 'V (code900)',
      independentTimeSeries: '直計!Y (2023)',
      perCountyChecks: 18,
      nationalComparison:
        '公式公表の独立全国集計表なし。47県の同一範囲合算を保持。総合エネルギー統計の全運輸を含む全国値とは比較しない。',
    },
  };
}
export function validateConfig(c, f) {
  assert.equal(c?.key, f.key);
  assert.equal(c.isActive, true);
  assert.equal(c.unit, f.unit);
  assert.equal(c.category, f.category);
  assert.deepEqual(c.entities, ['prefecture']);
  assert.deepEqual(c.years, { from: f.year, to: f.year });
  assert.equal(c.yearFormat, f.yearFormat);
  assert.deepEqual(c.display, { conversionFactor: 1, decimalPlaces: 1 });
  assert.deepEqual(
    c.source,
    EXPECTED_SOURCES[f.key],
    'source scope and denominator'
  );
}
export function makePayloads(
  datasets,
  configs,
  generatedAt = new Date().toISOString()
) {
  return FIELDS.map((f) => {
    validateConfig(configs[f.key], f);
    const data = datasets[f.family];
    requirePrefectures(data.rows);
    const rows = prefectures.map((p) => ({
      areaCode: p.prefCode,
      areaName: p.prefName,
      yearCode: String(f.year),
      yearName: f.yearName,
      unit: f.unit,
      value: data.rows.find((r) => r.areaCode === p.prefCode).values[f.column],
    }));
    const payload = parseStatsValuesPayload({
      metricKey: f.key,
      entityKind: 'prefecture',
      rows,
      meta: {
        generatedAt,
        rowCount: 47,
        areaCount: 47,
        yearRange: [String(f.year), String(f.year)],
        recipe: buildRecipe(configs[f.key]),
      },
    });
    const content = JSON.stringify(payload);
    return {
      key: `app/stats/${f.key}/values.json`,
      metricKey: f.key,
      rowCount: 47,
      sha256: sha(content),
      content,
    };
  });
}
async function sourceBytes(s, dir) {
  const path = resolve(dir, s.filename);
  let b;
  try {
    b = await readFile(path);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    const r = await fetch(s.url, { signal: AbortSignal.timeout(45000) });
    assert.ok(r.ok, 'official HTTP ' + r.status);
    b = Buffer.from(await r.arrayBuffer());
    assertHash(b, s.sha256);
    await mkdir(dir, { recursive: true });
    await writeFile(path, b);
  }
  assertHash(b, s.sha256);
  assert.equal(b.length, s.bytes);
  return b;
}
export async function main() {
  const { values: o } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': {
        type: 'string',
        default: resolve(process.cwd(), '.local/verification/themes/energy-gender-source'),
      },
      'config-file': { type: 'string' },
      out: {
        type: 'string',
        default: resolve(process.cwd(), '.local/verification/themes/energy-gender-source.json'),
      },
    },
  });
  const configs = o['config-file']
    ? Object.fromEntries(
        JSON.parse(await readFile(o['config-file'], 'utf8')).map((c) => [
          c.key,
          c,
        ])
      )
    : require('../../../packages/data-configs/src/registry.ts')
        .METRICS_REGISTRY;
  FIELDS.forEach((f) => validateConfig(configs[f.key], f));
  const other = new Map(),
    energyRows = [];
  for (const s of SOURCES) {
    console.error('Checking ' + s.filename);
    const b = await sourceBytes(s, o['source-dir']);
    if (s.filename.endsWith('.xlsx')) {
      const index = Number(s.filename.match(/pref(\d+)/)[1]) - 1,
        p = prefectures[index];
      const w = readEnergyWorkbook(
        resolve(o['source-dir'], s.filename),
        s.sha256
      );
      energyRows.push(parseEnergyWorkbook(w, byName(p.prefName)));
    } else other.set(s.filename, b);
  }
  const indexText = other.get('gender-index.html').toString('utf8');
  assert.ok(indexText.includes('令和8年5月公表'));
  validateEnergyDefinitions(
    pdfText(other.get('energy-explanation.pdf')),
    pdfText(other.get('energy-instructions.pdf')),
    pdfText(other.get('energy-revision-2024.pdf')),
    pdfText(other.get('energy-cell-sources.pdf'))
  );
  const datasets = {
    energy: combineEnergy(energyRows),
    manager: parseGender(
      pdfText(other.get('gender-managers.pdf'), 1),
      'manager'
    ),
    councillor: parseGender(
      pdfText(other.get('gender-councillors.pdf'), 1),
      'councillor'
    ),
  };
  const files = makePayloads(datasets, configs);
  if (o['write-local'])
    for (const f of files) {
      const p = resolve(root, '.local/r2', f.key);
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, f.content);
    }
  const proof = {
    status: 'PASS',
    writeLocal: o['write-local'],
    seriesCount: 6,
    canonicalRows: 282,
    sources: SOURCES,
    datasets,
    files: files.map(({ content, ...f }) => f),
  };
  await mkdir(dirname(resolve(o.out)), { recursive: true });
  await writeFile(o.out, JSON.stringify(proof, null, 2));
  console.log(
    JSON.stringify({
      status: 'PASS',
      seriesCount: 6,
      canonicalRows: 282,
      writeLocal: o['write-local'],
      out: o.out,
    })
  );
  return proof;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((e) => {
    console.error(e.stack);
    process.exitCode = 1;
  });
