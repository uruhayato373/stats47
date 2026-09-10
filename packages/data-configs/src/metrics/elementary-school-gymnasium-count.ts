import type { MetricConfig } from '../types';

export const elementarySchoolGymnasiumCount: MetricConfig = {
  key: 'elementary-school-gymnasium-count',
  title: '小学校体育館設置箇所数',
  subtitle: '公立・私立（国立大学附属学校を除く）',
  description: '小学校体育館設置箇所数を所在地の都道府県別に比較する。',
  note: '2024年10月1日現在の学校体育・スポーツ施設調査A。公立・私立（公私立大学附属を含む）の原表「小学校」「中学校」区分を使用し、国立大学法人の附属学校は大学・高専体育施設側へ含まれるため除く。単位は設置箇所で、保有学校数・整備率・地域開放数ではない。都道府県教育委員会と私立学校所管部局は47/47回答、市区町村教育委員会は1,697/1,741回答（97.5%）で未回答分を補完しない。公立小学5年生の体力調査と母集団・時点が異なり、施設量から体力への因果は示さない。',
  unit: '箇所',
  category: 'educationsports',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '体育・スポーツ施設現況調査',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040451156&fileKind=0',
    config: {
      source: {
        name: '体育・スポーツ施設現況調査',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040451156&fileKind=0',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040451156&fileKind=0',
        sourceSha256:
          'e83629d004129b5938aab83496e3dd8cccf6f118c0d0d3e1b37ef5b2f4d0523a',
        publicationIndexUrl:
          'https://www.mext.go.jp/sports/b_menu/toukei/chousa04/shisetsu/kekka/1368165.htm',
        table: '9 都道府県別・市区町村人口規模別・調査種別設置箇所数 体育館',
        valueColumn: '9!F12:F58（小学校）',
        dataYear: '2024年10月1日現在',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXシート9の学校施設欄F/Gを取得。学校区分合計E=F+G+H+Iと全国行を検査し、社会体育施設・民間推計値を取り込まない。',
        verification:
          '47県一意・欠測0・整数・全県と全国の学校4区分計が一致。学校区分5列の県計=全国、小学校17820箇所・中学校8995箇所。市町村未回答の注記を保持。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-education-core.mjs --write-local',
        releaseStatus: 'final',
        geography: '施設・学校所在地の都道府県',
        periodStart: '2024-10-01',
        periodEnd: '2024-10-01',
        releasedAt: '2026-04-30',
        governmentStatisticsCode: '00402101',
        definitionUrl:
          'https://www.mext.go.jp/sports/content/20260501-stiiki-300000983_2.pdf',
        definitionSha256:
          'de26c22c678289764c3ad01be89509104a5d31c507732419378b82af75038214',
        definitionPages: [2, 3, 4],
        sourceUnit: '箇所',
        municipalResponse: {
          received: 1697,
          distributed: 1741,
          percent: 97.5,
        },
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2024,
    to: 2024,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
};
