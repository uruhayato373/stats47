import type { MetricConfig } from '../types';

export const publicWaterAgedPipeLength: MetricConfig = {
  key: 'public-water-aged-pipe-length',
  title: '法定耐用年数を経過した水道管路延長',
  subtitle: '地方公営企業・法適用水道（上水道・簡易水道・用水供給）',
  description:
    '事業団体の所属県別に、法適用水道の法定耐用年数を経過した水道管路延長を比較します。経年化と更新の分母には同じ年度末の管路総延長を用います。',
  note: 'デジタル庁の公開データをstats47が県別に集計・加工しました。地方公営企業決算状況調査の法適用水道事業が対象です。末端給水事業、用水供給事業、独立会計の法適用簡易水道事業を含みます。同一会計内の簡易水道分は末端給水事業の内数なので二重に加算しません。法非適用簡易水道・民営水道等は対象外です。県の帰属は事業団体の所属県で、管路の物理的な所在地別ではありません。経年化率は法定耐用年数を経過した導水・送水・配水管延長の合計、更新率は年度内に更新した同3管の延長合計を、同年度末の総延長で割った割合です。事業者の率の単純平均や水道カルテの5年平均更新率は用いません。経年化は会計上の年数の指標で、実際の破損・漏水確率や緊急更新の必要性を直接示す値ではありません。原延長は千m（kmと数値同一）で小数第2位まで、率は公表延長から計算して小数第6位に丸めています。',
  unit: 'km',
  category: 'infrastructure',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '総務省「地方公営企業決算状況調査」・デジタル庁公開データ',
    url: 'https://www.digital.go.jp/resources/govdashboard/watersupply',
    config: {
      source: {
        name: '地方公営企業決算状況調査 01 施設及び業務概況に関する調（デジタル庁構造化CSV）',
        url: 'https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/9112b58e-556c-429e-906f-45be48b63fd9/db7e75fb/20260703_resources_govdashboard_watersupply_table_02.zip',
      },
      provenance: {
        url: 'https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/9112b58e-556c-429e-906f-45be48b63fd9/db7e75fb/20260703_resources_govdashboard_watersupply_table_02.zip',
        sourceSha256:
          'c9e6254f8a13e1df65d9ea5bdc0561aeb0c15fc1fdd3214d82e490599990bc5f',
        member: '2024.csv',
        memberSha256:
          '6922a6570522e41a2352c86669c92f260e5ab4ac6140b129ca91941af413b1b0',
        publicationIndexUrl:
          'https://www.digital.go.jp/resources/govdashboard/watersupply',
        originalStatisticsUrl:
          'https://www.e-stat.go.jp/stat-search?page=1&toukei=00200251&tstat=000001125335',
        crossCheckXls: {
          url: 'https://www.soumu.go.jp/main_content/001064895.xls',
          sha256:
            'ad3f1d6f4d36cd0f868b5e54a0294708828794b6f8fc28cf6e53a526e2dd9162',
        },
        nationalCrossCheckXls: {
          url: 'https://www.soumu.go.jp/main_content/001064869.xls',
          sha256:
            '065baf4f8a8c4468e49208384195fd549e7c667590e536d272c5268c6ffc2885',
        },
        definitionUrl:
          'https://www.digital.go.jp/resources/govdashboard/watersupply/description',
        license: 'PDL1.0',
        licenseUrl: 'https://www.digital.go.jp/copyright-policy',
        processedBy: 'stats47',
        table: '2024.csv / 01 施設及び業務概況に関する調',
        valueColumn:
          '列013・列014・列015・列060・列061・列062・列063・列064・列065',
        dataYear: '2024年度末（2025年3月31日）。更新延長は2024年度内。',
        accessedAt: '2026-09-10',
        denominator:
          '同じ1703法適用事業の導水管+送水管+配水管総延長を県別に合算。経年化率と更新率の共通分母。',
        geography:
          '原表の事業団体所属県。地方公共団体コード先頭2桁を公式47県名へ写像し年鑑の所属県・団体名と照合。県をまたぐ事業の管路を物理所在地へ按分しない。',
        universe:
          '001末端1230+002用水供給69+005独立簡易404=1703事業。006同一会計内簡易96は001の内数で除外。法非適用・民営等は対象外。',
        extraction:
          'ZIPと2024.csvのSHA256を固定し、UTF-8 CSVの01表から9項目を抽出。年度・単位・正式項目名・事業種別・重複・欠測・内数包含を検査。0.01km単位の整数で県別合算。千mとkmの数値は同じ。',
        verification:
          '1703事業×3延長=5109値が総務省年鑑(23)の所属県・団体名・事業区分付き値と一致。47県全ての3延長および全国9管種値を照合。全国総延長812358.64km、経年213050.93km、更新4624.74km。原表9項目に欠測0。除外006内数に4事業10セルの親超過と別1事業2セルの経年管＞同管種総延長があり、当該内数を県値の補正・逆算に用いない。採用1703事業の3延長は年鑑と全一致。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-water-pipe-maintenance.mjs --write-local',
        formula: 'sum(列060 + 列061 + 列062)',
      },
      valueField: 'agedKm',
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2024,
    to: 2024,
  },
  yearFormat: 'fiscal',
  display: {
    conversionFactor: 1,
    decimalPlaces: 2,
  },
  isActive: true,
};
