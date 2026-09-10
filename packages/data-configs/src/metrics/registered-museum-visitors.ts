import type { MetricConfig } from '../types';

export const registeredMuseumVisitors: MetricConfig = {
  key: 'registered-museum-visitors',
  title: '登録博物館の入館者数',
  subtitle: '美術博物館等を含む',
  description: '登録博物館の入館者数を所在地の都道府県別に比較する。',
  note: '2024年度社会教育調査の確定値による2023年度間の入館者数。施設所在地の都道府県別で、美術博物館のほか総合・科学・歴史博物館や動植物園・水族館等を含む。実人数や住民の利用率ではなく、特別展は内数。登録博物館・指定施設・博物館類似施設を区別し、美術館だけの入館者数とは呼ばない。既存の施設数とは対象年・法的区分を揃えるまで1施設当たり値を作らない。',
  unit: '人',
  category: 'educationsports',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '社会教育調査',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439522&fileKind=0',
    config: {
      source: {
        name: '社会教育調査',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439522&fileKind=0',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439522&fileKind=0',
        sourceSha256:
          '368fb0c27c381eb9cab419415ae43e46f50bd1fb80e2ef2533f8024225f50e3d',
        publicationIndexUrl:
          'https://www.mext.go.jp/b_menu/toukei/chousa02/shakai/kekka/k_detail/2024.htm',
        table: '113 博物館の入館者数（都道府県別）',
        valueColumn: '113!G22:G68（登録博物館・入館者総数）',
        dataYear: '2023年度',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXの県名列Bを47県と照合し、法的区分別の入館者総数を抽出。設置者別行と所在地別行を混ぜない。',
        verification:
          '47県一意・欠測0・整数・各列47県計=全国。登録+指定=博物館総数、特別展<=総数、設置者別全国計=県別全国計を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-education-core.mjs --write-local',
        releaseStatus: 'final',
        geography: '施設・学校所在地の都道府県',
        periodStart: '2023-04-01',
        periodEnd: '2024-03-31',
        surveyYear: '2024',
        releasedAt: '2026-03-27',
        governmentStatisticsCode: '00400004',
        sourceUnit: '人',
        definitionUrl:
          'https://www.mext.go.jp/content/20240821-mxt_chousa01-000037636_05.pdf',
        definitionSha256:
          '1386cdccc82de849e0320473f176353588ea3d44fcd522c12936daf70af9feb3',
        definitionPages: [3, 6],
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
    decimalPlaces: 0,
  },
  isActive: true,
};
