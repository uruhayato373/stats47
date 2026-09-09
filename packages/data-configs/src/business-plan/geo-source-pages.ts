import { GEO_SOURCE_POLICY_PAGES } from './geo-source-policy-pages';
import { GEO_SOURCE_SERVICE_PAGES } from './geo-source-service-pages';

/** Authored reading guides. Versions refer to the GIS registry, not the current year. */
export type GeoSourceField = {
  key: string;
  label: string;
  description: string;
  unit?: string;
  alternateUnit?: { property: string; value: string; unit: string };
  values?: Record<string, string>;
  /** Some source files have distinct schemas (e.g. primary/secondary medical areas). */
  onlyWhenPresent?: true;
  /** A source may store zero for unpublished values or for a value recorded on another feature. */
  requiredCodes?: { key: string; values: string[]; fallback: string }[];
};
export type GeoSourcePageContent = {
  dataId: string;
  version: string;
  summary: string;
  period: string;
  coverage: string;
  reading: string;
  limitations: string;
  fields: GeoSourceField[];
  relatedIds: string[];
  sourceCheckedAt: string;
  additionalSources?: { label: string; url: string }[];
};
const sourceCheckedAt = '2026-09-08';
const landUseValues = {
  '0100': '田',
  '0200': 'その他の農用地',
  '0500': '森林',
  '0600': '荒地',
  '0700': '建物用地',
  '0901': '道路',
  '0902': '鉄道',
  '1000': 'その他の用地',
  '1100': '河川地及び湖沼',
  '1400': '海浜',
  '1500': '海水域',
  '1600': 'ゴルフ場',
};
function terrain(
  dataId: string,
  prefix: string,
  size: string,
  relatedIds: string[]
): GeoSourcePageContent {
  return {
    dataId,
    version: '11',
    sourceCheckedAt,
    summary: `${size}メッシュごとに、平均・最高・最低の標高と傾斜角度を確認できます。`,
    period:
      '2011年度整備。主な標高の原資料は2009年5月1日時点（北方領土は2008年3月31日時点）。',
    coverage: `標高データを整備した地域の${size}メッシュ。配布区画を選んで表示します。`,
    reading: `平地から山地へどのように高さが変わるかを、メッシュを選んで確かめます。平均標高と最高・最低標高を併せて読むと、同じ${size}の中にある高低差を確認できます。`,
    limitations:
      '値は区画内を集計したものです。建物や道路の一点の高さ・勾配には使えません。原資料は東日本大震災より前のもので、その後の地形変化を反映するとは限りません。unknownは欠測で、0とは区別します。',
    fields: [
      {
        key: `${prefix}_001`,
        label: 'メッシュコード',
        description: '表示している区画の識別番号。',
      },
      {
        key: `${prefix}_002`,
        label: '平均標高',
        unit: 'm',
        description: '区画内の標高の平均。',
      },
      {
        key: `${prefix}_003`,
        label: '最高標高',
        unit: 'm',
        description: '区画内の最も高い標高。',
      },
      {
        key: `${prefix}_004`,
        label: '最低標高',
        unit: 'm',
        description: '区画内の最も低い標高。',
      },
      {
        key: `${prefix}_010`,
        label: '平均傾斜角度',
        unit: '度',
        description: '区画内で算出した傾斜角度の平均。',
      },
    ],
    relatedIds,
  };
}
const landUseFields: GeoSourceField[] = [
  {
    key: '細分メッシュコード',
    label: 'メッシュコード',
    description: '100m区画の識別番号。',
  },
  {
    key: '土地利用種別',
    label: '土地利用の区分',
    description:
      '衛星画像等から判読した区分。コードの意味は整備年度によって異なります。',
    values: landUseValues,
  },
  {
    key: '衛星写真撮影年月日',
    label: '衛星写真の撮影日',
    description: '土地利用を読み取るために使った画像の日付（年月日8桁）。',
  },
];

export const GEO_SOURCE_PAGES: GeoSourcePageContent[] = [
  terrain('G04-a', 'G04a', '1km', ['G04-c', 'G04-d', 'G08']),
  {
    dataId: 'L01',
    version: '26',
    sourceCheckedAt,
    summary:
      '2026年1月1日時点の標準地の地価公示価格を、地点と属性から確認できます。',
    period: '2026年1月1日時点の価格。',
    coverage:
      '全国の地価公示の標準地。すべての土地の価格を示すものではありません。',
    reading:
      '地点を選ぶと、価格と用途区分、前年からの変動率を確認できます。周辺の点と比べるときは、住宅地・商業地などの用途と価格時点を揃えます。',
    limitations:
      '地価公示価格は標準地に対する評価で、実際の売買価格や近隣の全敷地の価格ではありません。点の多さを地価の高さとして読まないでください。',
    fields: [
      {
        key: 'L01_002',
        label: '用途区分',
        description: '標準地の土地利用の区分。',
      },
      { key: 'L01_007', label: '価格の年', description: '地価公示の対象年。' },
      {
        key: 'L01_008',
        label: '地価公示価格',
        unit: '円/m²',
        description: '標準地の1m²当たりの価格。',
      },
      {
        key: 'L01_009',
        label: '対前年変動率',
        unit: '%',
        description: '継続する標準地の前年価格に対する変化。',
      },
      { key: 'L01_025', label: '所在・地番', description: '標準地の所在地。' },
    ],
    relatedIds: ['L02', 'L03-a', 'mesh1000r6'],
  },
  {
    dataId: 'L02',
    version: '25',
    sourceCheckedAt,
    summary:
      '2025年7月1日時点の基準地の調査価格を、用途や所在地と併せて確認できます。',
    period: '2025年7月1日時点の価格。',
    coverage: '全国の都道府県地価調査の基準地。',
    reading:
      '用途区分を確認してから価格を読みます。林地（用途区分020）は円/10a、それ以外は円/m²なので、そのまま数値を比較できません。地価公示と比べる場合は地点と価格時点も確かめます。',
    limitations:
      '林地とその他の土地では価格の分母が異なります。調査価格は基準地の評価であり、売買価格を示すものではありません。1月1日時点の地価公示とも同じ時点の値ではありません。',
    fields: [
      {
        key: 'L02_001',
        label: '用途区分',
        description: '020は林地。価格の単位を判断する項目。',
      },
      { key: 'L02_005', label: '価格の年', description: '地価調査の対象年。' },
      {
        key: 'L02_006',
        label: '調査価格',
        unit: '円/m²',
        alternateUnit: { property: 'L02_001', value: '020', unit: '円/10a' },
        description: '林地は10a当たり、その他は1m²当たりの価格。',
      },
      {
        key: 'L02_007',
        label: '対前年変動率',
        unit: '%',
        description: '継続する基準地の前年価格に対する変化。',
      },
    ],
    relatedIds: ['L01', 'L03-a', 'mesh1000r6'],
  },
  {
    dataId: 'L03-a',
    version: '21',
    sourceCheckedAt,
    summary:
      '1kmメッシュの中に、田・森林・建物用地などがそれぞれどれだけあるかを面積で確認できます。',
    period: 'データ基準年度2021年度。配布・更新年度とは区別します。',
    coverage:
      '2021年度版として収録された地域の1kmメッシュ。原典の整備範囲を確認してください。',
    reading:
      '区画内の森林や建物用地などの面積を並べて、土地の使われ方を読みます。区画を単一の土地利用に分類した100mメッシュとは、値の持ち方が異なります。',
    limitations:
      '各項目はm²で、割合ではありません。メッシュは厳密に1,000,000m²ではないため、割合の分母を固定しないでください。異なる年度の差には判読方法や画像の解像度の変化も含まれます。',
    fields: ['田', 'その他の農用地', '森林', '建物用地', '河川地及び湖沼'].map(
      (key) => ({
        key,
        label: key,
        unit: 'm²',
        description: `区画内で${key}に分類された面積。`,
      })
    ),
    relatedIds: ['L03-b', 'L03-b-c', 'L03-b-u'],
  },
  {
    dataId: 'W09',
    version: '05',
    sourceCheckedAt,
    summary:
      '湖や貯水池の形と広がりを確認し、湖沼名や収録されている水深情報を調べられます。',
    period:
      '2005年9月1日時点を基準に整備。原資料の作成年は資料ごとに異なります。',
    coverage: '国土数値情報に収録された全国の湖沼・貯水池の範囲。',
    reading:
      '湖の範囲を選び、名前と行政区域コードを確認します。山間の貯水池と平野部の湖など、位置と形を見比べる入口として使えます。',
    limitations:
      '現在の水位や水面の形を示す地図ではありません。最大水深・水面標高は原典で対象とされた自然湖沼だけに付与されるため、空欄を0と読まないでください。',
    fields: [
      {
        key: 'W09_001',
        label: '湖沼名',
        description: '原典に記録された湖沼の名称。',
      },
      {
        key: 'W09_002',
        label: '行政区域コード',
        description: '湖沼に付与された市区町村のコード。',
      },
      {
        key: 'W09_003',
        label: '最大水深',
        description: '原典で測深対象とされた自然湖沼のみ収録。',
      },
      {
        key: 'W09_004',
        label: '水面標高',
        description: '原典で測深対象とされた自然湖沼のみ収録。',
      },
    ],
    relatedIds: ['G04-a', 'L03-a', 'N03'],
  },
  {
    dataId: 'A45',
    version: '19',
    sourceCheckedAt,
    summary:
      '国有林野を管理する小班ごとの区画と、管理署・国有林名などの属性を確認できます。',
    period: '2019年度整備。原資料は2018年4月1日時点。',
    coverage: '林野庁の国有林GISをもとにした全国の小班区画。',
    reading:
      '小班とは森林管理のために区切った区画です。連続して見える森林にも管理上の区切りがあることを、林小班名や管理署と併せて確かめられます。',
    limitations:
      '国有林野の区画であり、日本の森林全体の分布ではありません。私有林・公有林の不存在を示すものでもありません。樹種や林齢などの属性は原資料の時点に注意してください。',
    fields: [
      {
        key: 'A45_008',
        label: '森林管理局',
        description: '当該小班を管轄する管理局。',
      },
      {
        key: 'A45_009',
        label: '森林管理署',
        description: '当該小班を管轄する管理署。',
      },
      {
        key: 'A45_011',
        label: '林小班名',
        description: '林班と小班の識別名。',
      },
      {
        key: 'A45_013',
        label: '国有林名',
        description: '当該小班が所在する国有林の名称。',
      },
      {
        key: 'A45_027',
        label: '小班の面積',
        unit: 'ha',
        description: '原典に収録された小班の面積。',
      },
    ],
    relatedIds: ['L03-a', 'G04-a', 'N03'],
  },
  {
    dataId: 'A54',
    version: '23',
    sourceCheckedAt,
    summary:
      '大規模盛土造成地のおおよその範囲と、谷埋め型・腹付け型などの区分を確認できます。',
    period: '2023年3月31日時点。',
    coverage: '自治体の資料を国土交通省が集約した造成地の範囲。',
    reading:
      '区域を選び、盛土の区分と所在する市区町村を確かめます。地形を確認する標高メッシュと見比べる前に、どの場所が調査対象として整理されているかを把握できます。',
    limitations:
      '収録は直ちに危険であるという判定ではありません。安全性の確認対象を把握する資料で、最新の状況は自治体で確認してください。原典は重要事項説明等の根拠には利用できないとしています。',
    fields: [
      {
        key: 'A54_001',
        label: '盛土区分',
        description: '造成地の盛土の形式。',
        values: { '1': '谷埋め型', '2': '腹付け型', '9': '区分なし' },
      },
      {
        key: 'A54_003',
        label: '都道府県',
        description: '造成地の所在する都道府県。',
      },
      {
        key: 'A54_005',
        label: '市区町村',
        description: '造成地の所在する市区町村。',
      },
    ],
    relatedIds: ['G04-a', 'G04-d', 'N03'],
  },
  terrain('G04-c', 'G04c', '500m', ['G04-a', 'G04-d', 'G08']),
  terrain('G04-d', 'G04d', '250m', ['G04-a', 'G04-c', 'G08']),
  {
    dataId: 'G08',
    version: '15',
    sourceCheckedAt,
    summary:
      '周囲より低く排水が難しい低位地帯の範囲を、標高資料から抽出した地図です。',
    period: '2015年度整備。',
    coverage: '数値標高モデル等から抽出された低位地帯の範囲。',
    reading:
      '区域のまとまりと周囲の地形を見比べます。属性の面積と最大浸水深は、このデータの抽出条件に基づく値として確認します。',
    limitations:
      '洪水浸水想定区域とは作り方と条件が異なります。この地図だけで浸水の発生確率や安全性を判断せず、災害に備える際は自治体の最新ハザードマップも確認してください。',
    fields: [
      {
        key: 'G08_001',
        label: '面積',
        unit: 'ha',
        description: '低位地帯として抽出された範囲の面積。',
      },
      {
        key: 'G08_002',
        label: '最大浸水深',
        unit: 'm',
        description:
          '原典が想定する低位地帯での最大浸水深。洪水想定とは条件が異なります。',
      },
      {
        key: 'G08_003',
        label: '参照資料コード',
        description: '抽出に使用した標高資料の区分。',
      },
    ],
    relatedIds: ['G04-a', 'A31b', 'A51'],
  },
  {
    dataId: 'L03-b',
    version: '21',
    sourceCheckedAt,
    summary:
      '100mメッシュごとの土地利用を、田・森林・建物用地などの区分で確認できます。',
    period: 'データ基準年度2021年度。画像の撮影日は区画ごとに確認できます。',
    coverage: '全国の土地利用を100mメッシュ単位で収録。',
    reading:
      '区画を選んで土地利用種別を確認し、市街地と農地、森林の移り変わりを読みます。面積を持つ1kmメッシュと併せると、細かな位置と広い範囲の構成を使い分けられます。',
    limitations:
      '画像から判読した土地利用であり、法的な用途地域や個別敷地の境界ではありません。2021年度版とそれ以前の差には、画像の高解像度化による判読結果の修正も含まれます。',
    fields: landUseFields,
    relatedIds: ['L03-a', 'L03-b-c', 'L03-b-u'],
    additionalSources: [
      {
        label: '土地利用種別のコード表',
        url: 'https://nlftp.mlit.go.jp/ksj/gml/codelist/LandUseCd-09.html',
      },
    ],
  },
  {
    dataId: 'L03-b-c',
    version: '21',
    sourceCheckedAt,
    summary: '三大都市圏の土地利用を、50mメッシュ単位で詳しく確認できます。',
    period: 'データ基準年度2021年度。',
    coverage: '三大都市圏。全国を同じ範囲で収録したデータではありません。',
    reading:
      '100mメッシュでは一つに見える場所を、より細かな区画で確認します。対象都市圏の中で、土地利用種別と撮影日を見ながら市街地の構成を読み取ります。',
    limitations:
      '細かいメッシュでも個別の建物や土地の登記境界を示すものではありません。対象範囲外の空白を、土地利用が存在しない地域として扱わないでください。',
    fields: [
      {
        key: '詳細メッシュコード',
        label: 'メッシュコード',
        description: '50m区画の識別番号。',
      },
      ...landUseFields.slice(1),
    ],
    relatedIds: ['L03-b', 'L03-b-u', 'L03-a'],
    additionalSources: [
      {
        label: '土地利用種別のコード表',
        url: 'https://nlftp.mlit.go.jp/ksj/gml/codelist/LandUseCd-09.html',
      },
    ],
  },
  {
    dataId: 'L03-b-u',
    version: '21',
    sourceCheckedAt,
    summary:
      '100mメッシュの土地利用を、高層建物・工場・低層建物など都市の用途を含む区分で確認できます。',
    period: 'データ基準年度2021年度。',
    coverage: '全国の土地利用を、都市の用途を細かく分けた100mメッシュで収録。',
    reading:
      '市街地の中でもどのような建物用地が分布しているかを確認します。通常の土地利用細分メッシュとは区分が異なるので、コードの定義を揃えて比較します。',
    limitations:
      '土地利用の判読結果であり、個々の建物の高さ・戸数や法的な用途地域を示すものではありません。同じ数値コードでも他の土地利用データと意味が同じとは限りません。',
    fields: landUseFields.map((field) =>
      field.key === '土地利用種別'
        ? {
            ...field,
            values: undefined,
            description:
              '都市地域用のコード表で確認する土地利用区分。一般の土地利用細分メッシュとは区分が異なります。',
          }
        : field
    ),
    relatedIds: ['L03-b', 'L03-b-c', 'L03-a'],
  },
  ...GEO_SOURCE_POLICY_PAGES,
  ...GEO_SOURCE_SERVICE_PAGES,
];

export function findGeoSourcePage(dataId: string, version?: string) {
  return GEO_SOURCE_PAGES.find(
    (page) => page.dataId === dataId && page.version === version
  );
}
