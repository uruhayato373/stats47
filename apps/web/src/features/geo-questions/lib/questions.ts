/**
 * 問いのページ (試作) の定義。1 つの問いに対して、何を比べ、どう読むか、何を言わないかを決める。
 * 計算は packages/gis/src/geo-questions/scripts/build-geo-questions.ts、結果は R2 app/geo/questions/<slug>.json。
 * 試作のため定義はここに置く。設計が固まったら問いの台帳 (data/geo/) へ移す (GEO-OVERLAY-URL-01)。
 */
export interface GeoQuestion {
  readonly slug: string;
  /** ページの題 (問いそのもの) */
  readonly question: string;
  /** 何をどう比べたか (1〜2 文) */
  readonly lead: string;
  readonly chartTitle: string;
  readonly mapTitle: string;
  /** 組の決め方 (空間演算) */
  readonly method: readonly string[];
  /** 読み方の注意・限界 */
  readonly cautions: readonly string[];
  /** このページでは言わないこと (因果の解釈はブログ・テーマ) */
  readonly notClaimed: string;
  readonly related: readonly { readonly label: string; readonly href: string }[];
}

export const GEO_QUESTIONS: readonly GeoQuestion[] = [
  {
    slug: 'ic-population',
    question: '高速道路の IC ができた市区町村は、人口が減りにくかったか',
    lead: '市区町村を「最初のインターチェンジができた年」で 4 つの組に分け、1980年からの人口の推移を組ごとに並べました。',
    chartTitle: '組ごとの人口の推移 (1980年 = 100)',
    mapTitle: '最初の IC ができた年で塗り分けた市区町村',
    method: [
      '一般 IC とスマート IC の位置を、今の市区町村の境界 (政令指定都市は市全体) に重ね、市区町村ごとに最も早い供用開始年を求めました。',
      '組の人口は、組に入る市区町村の人口の合計です。1980〜2025年の国勢調査のすべてで人口がある市区町村だけを使います。',
    ],
    cautions: [
      '大都市は IC が早くからあり、組の合計を押し上げます。組の差には、IC 以外の都市の規模の違いが混ざっています。',
      'IC が市区町村の境界の外にあっても、すぐ近くなら使えます。境界の中にあるかだけで組を決めています。',
      '人口は合併を今の市区町村の境界に組み替えた値です。',
    ],
    notClaimed: 'IC が人口を増やした (または減少を止めた) とは言っていません。並べたときの違いを示すだけです。',
    related: [
      { label: '高速道路網の変遷 (年ごとの地図)', href: '/geo/history/expressway' },
      { label: '工場は IC の近くに集まったか', href: '/geo/ic-manufacturing' },
    ],
  },
  {
    slug: 'ic-manufacturing',
    question: '工場はインターチェンジの近くに集まったか',
    lead: '市区町村を「最寄りの IC までの距離」で 4 つの組に分け、全国の製造品出荷額に占める割合の推移を組ごとに並べました。',
    chartTitle: '全国の製造品出荷額に占める割合 (%)',
    mapTitle: '最寄りの IC までの距離で塗り分けた市区町村',
    method: [
      '2023年にある一般 IC とスマート IC を使い、IC が市区町村の中にあるか、無ければ市区町村の重心から最寄りの IC までの距離で組を決めました。',
      '割合の分母は、1980〜2023年のすべてで出荷額がある市区町村の合計です。',
    ],
    cautions: [
      '距離は今 (2023年) の IC で測っています。1980年の時点では、まだ IC が無かった市区町村も「近い」組に入ります。',
      '出荷額は名目値です。割合で比べるので物価の影響は打ち消し合いますが、産業の構成の違いは残ります。',
    ],
    notClaimed: 'IC ができたから工場が移ってきた、とは言っていません。距離の組ごとの割合の推移を示すだけです。',
    related: [
      { label: '高速道路網の変遷 (年ごとの地図)', href: '/geo/history/expressway' },
      { label: 'IC ができた市区町村の人口', href: '/geo/ic-population' },
    ],
  },
  {
    slug: 'shinkansen-population',
    question: '新幹線の駅ができた町は、どう変わったか',
    lead: '市区町村を「新幹線の駅ができた年」で 4 つの組に分け、1980年からの人口の推移を組ごとに並べました。',
    chartTitle: '組ごとの人口の推移 (1980年 = 100)',
    mapTitle: '新幹線の駅ができた年で塗り分けた市区町村',
    method: [
      '鉄道時系列データの駅のうち、事業者種別が JR 新幹線のものを、今の市区町村の境界に重ね、市区町村ごとに最も早い開業年を求めました。',
      '組の人口は、組に入る市区町村の人口の合計です。',
    ],
    cautions: [
      '新幹線の駅がある市区町村は 102 しかなく、組ごとの数が少ない組があります。1 つの大都市が組の動きを左右します。',
      '原典では 1950年以前の開業は 1950年にまとめられています。',
    ],
    notClaimed: '新幹線の駅が人口を増やした、とは言っていません。駅ができた時期ごとの違いを示すだけです。',
    related: [
      { label: '鉄道網の変遷 (年ごとの地図)', href: '/geo/history/railway' },
      { label: 'IC ができた市区町村の人口', href: '/geo/ic-population' },
    ],
  },
  {
    slug: 'airport-tourism',
    question: '空港のある県とない県で、宿泊者数の伸び方は違うか',
    lead: '都道府県を「2009年時点の空港」で 3 つの組に分け、延べ宿泊者数の推移を組ごとに並べました。',
    chartTitle: '組ごとの延べ宿泊者数の推移 (2009年 = 100)',
    mapTitle: '2009年時点の空港で塗り分けた都道府県',
    method: [
      '空港時系列データの県別の空港数 (2009年) から、拠点空港・国管理空港がある県、地方管理などの空港だけがある県、空港が無い県に分けました。',
      '組の宿泊者数は、組に入る県の延べ宿泊者数の合計です。',
    ],
    cautions: [
      '宿泊者数の統計は 2009年からなので、空港ができる前後は比べられません (この間に開港したのは静岡・茨城など少数)。',
      '2020〜2022年は感染症の影響で全ての組が大きく減っています。',
      '空港が無い県には、首都圏・近畿の大都市圏が多く含まれます。',
    ],
    notClaimed: '空港があるから宿泊者が増えた、とは言っていません。空港の有無で分けた組の推移を示すだけです。',
    related: [
      { label: '空港の変遷 (年ごとの地図)', href: '/geo/history/airport' },
      { label: '工場は IC の近くに集まったか', href: '/geo/ic-manufacturing' },
    ],
  },
];

export function findGeoQuestion(slug: string): GeoQuestion | null {
  return GEO_QUESTIONS.find((question) => question.slug === slug) ?? null;
}
