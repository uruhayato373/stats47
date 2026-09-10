import type { MetricConfig } from '../types';

export const rawMilkProduction: MetricConfig = {
  key: 'raw-milk-production',
  title: '生乳生産量',
  subtitle: '年間の生乳生産量（出荷・未出荷を含む）',
  description: '年間の生乳生産量を都道府県別に比較する。',
  note: '2025年1〜12月の確報。生乳は搾乳したままの牛の乳で、初乳（分娩後5日内）を除く。処理場・工場への出荷量と自家飲用・子牛ほ乳用など未出荷分を含み、疾病・薬剤投与等による廃棄乳は含まない。都道府県間の移出入を把握した生産地別の量であり、工場所在地別の牛乳製品生産量ではない。原表ｔと同じ数量尺度のtで表示。飼養頭数は2月1日時点、こちらは年間の生産フローで、同じ分母の構成比や単純な1頭当たり生産性にはしない。',
  unit: 't',
  category: 'agriculture',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '農林水産省「令和7年牛乳乳製品統計」',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040477606&fileKind=0',
    config: {
      source: {
        name: '農林水産省「令和7年牛乳乳製品統計」',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040477606&fileKind=0',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040477606&fileKind=0',
        table: '第2表 生乳生産量（都道府県別）（月別）',
        valueColumn: 'g011-r07-002!E13:E59（年計・実数）',
        dataYear: '2025年1〜12月',
        accessedAt: '2026-09-10',
        sourceSha256:
          'a385a247bd2bcba11e0b50975484bf7595a76230e6c1603c45aec9c6f4f260bf',
        extraction:
          '全国E12、47県E13:E59。H:Sの月別12列は年計照合専用で年次観測値へ混在させない。全角ｔをtと表記し数量換算しない。',
        verification:
          '県名・順序・47県・欠測・重複・非負整数・年計=12か月計（全国と各県）、年計と各月の47県計=全国を完全一致で検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-raw-milk-production.mjs --write-local',
        definitionUrl:
          'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040477603&fileKind=2',
        definitionSha256:
          'bd716fbb803bfea58b646b164bc97d5a69715f6564eaae7d895b5434636bfcaa',
        releaseStatus: 'final',
        releasedAt: '2026-07-28',
        releaseIndexUrl:
          'https://www.e-stat.go.jp/stat-search/files?layout=datalist&lid=000001487124&page=1',
        sourceUnit: 'ｔ',
        prefectureRows: [13, 59],
        nationalRow: 12,
        geography:
          '生産地の都道府県。県間移出入量を把握して生産量と処理量を区別する。',
        surveyUniverse:
          '乳製品製造を行う全処理場・工場等の基礎調査と、乳製品工場の全数及び月間受乳量300t以上、県間移出入等の条件を用いる有意抽出の月別調査。農家全数調査とは呼ばない。',
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2025,
    to: 2025,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
};
