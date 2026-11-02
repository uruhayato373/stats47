import routesJson from '../../../../data/content/routes.json';

/**
 * サイト内 URL の組み立て口 (data/content/routes.json の pattern が正本)。
 *
 * 逆変換 `contentIdFromHref` (index.ts) と同じ route 契約から href を作るので、
 * テンプレート文字列で `/ranking/${key}` と書く代わりにこれを使う。
 * ブラウザ部品 (ヘッダー等) からも読むため、tags.json を持つ index.ts とは別ファイルにして
 * routes.json 以外を import しない (`@stats47/data-configs/content/href`)。
 *
 * パラメータは URL 安全なキー (ranking key・テーマ slug・都道府県コード) を想定し、
 * 既存の出力と同じく素のまま埋める。日本語のタグキーなどは呼び元が必要に応じて encode する。
 */
const HREF_ROUTE_IDS = {
  ranking: 'route:ranking:rankingKey',
  theme: 'route:theme:themeSlug',
  area: 'route:area:areaCode',
  'area-theme': 'route:area-theme:areaCode:themeSlug',
  // 県内の市区町村を比べる (2026-10-31 IA-REGION-THEME-01)
  'area-theme-cities': 'route:area-theme-cities:areaCode:themeSlug',
  city: 'route:city:areaCode:cityCode',
  // 1 つの市区町村×テーマ (2026-10-31 IA-REGION-THEME-01。旧: 市区町村×分野。分野の URL はテーマへ 301)
  'city-theme': 'route:city-theme:areaCode:cityCode:themeSlug',
  blog: 'route:blog:slug',
  tag: 'route:tag:tagKey',
  category: 'route:category:categoryKey',
  'category-compare': 'route:category-compare:categoryKey',
  survey: 'route:survey:surveyKey',
  'municipality-ranking': 'route:municipality-ranking:rankingKey',
  'municipality-pref-ranking': 'route:municipality-pref-ranking:rankingKey:prefCode',
  'municipality-theme': 'route:municipality-theme:themeSlug',
  'japan-theme': 'route:japan-theme:themeSlug',
  geo: 'route:geo:analysisSlug',
  'geo-stage': 'route:geo:analysisSlug:prefCode:stage',
  'geo-data': 'route:geo-data:analysisSlug:prefCode',
  'geo-layer': 'route:geo-layer:layerSlug',
  'geo-datasets': 'route:geo-datasets:dataId',
  product: 'route:product:slug',
  'product-from-note': 'route:products-from-note:slug:noteKey',
} as const;

export type HrefRouteName = keyof typeof HREF_ROUTE_IDS;

/** route id の末尾 (`route:<kind>:<p1>:<p2>`) からパラメータ名を型で取り出す */
type ParamNames<Id extends string> = Id extends `route:${string}:${infer Rest}` ? SplitParams<Rest> : never;
type SplitParams<S extends string> = S extends `${infer Head}:${infer Tail}` ? Head | SplitParams<Tail> : S;

export type HrefParams<Name extends HrefRouteName> = Record<ParamNames<(typeof HREF_ROUTE_IDS)[Name]>, string>;

const PATTERN_BY_ID = new Map(routesJson.routes.map((route) => [route.id, route.pattern] as const));

/** テスト用: 名前 → route id の対応 (routes.json と食い違わないことを検査する) */
export const HREF_ROUTES: Readonly<Record<HrefRouteName, string>> = HREF_ROUTE_IDS;

/**
 * 同じ統計調査なのに調査 ID が分かれているもの → 表示する 1 つのハブの ID。
 * 家計調査は品目別 (kakei-chousa) と、社会・人口統計体系を経由した収入・支出割合 (household-survey) に分かれ、
 * ハブも 2 つあった。読者にとっては 1 つの調査なので、ハブを kakei-chousa にまとめる (2026-11-02 オーナー判断)。
 * 指標の紐付け (surveyIds) は元の ID のまま残し、リンク・一覧・転送だけをこの表で寄せる。
 */
export const SURVEY_HUB_ALIASES: Readonly<Record<string, string>> = {
  'household-survey': 'kakei-chousa',
};

/** 調査 ID を表示するハブの ID へ寄せる (別名でなければそのまま) */
export function canonicalSurveyHubKey(surveyId: string): string {
  return SURVEY_HUB_ALIASES[surveyId] ?? surveyId;
}

/** ハブに集める調査 ID の一覧 (ハブ自身の ID + そこへ寄せる別名) */
export function surveyHubSourceIds(hubKey: string): string[] {
  return [hubKey, ...Object.keys(SURVEY_HUB_ALIASES).filter((alias) => SURVEY_HUB_ALIASES[alias] === hubKey)];
}

export function hrefFor<Name extends HrefRouteName>(name: Name, params: HrefParams<Name>): string {
  const id = HREF_ROUTE_IDS[name];
  const pattern = PATTERN_BY_ID.get(id);
  if (!pattern) throw new Error(`routes.json に ${id} がない`);
  const raw = params as Record<string, string>;
  const values = name === 'survey' && raw.surveyKey ? { ...raw, surveyKey: canonicalSurveyHubKey(raw.surveyKey) } : raw;
  // 描画中に例外を出さない (置き換え前のテンプレート文字列と同じく値をそのまま埋める)
  return pattern.replace(/\[([^\]]+)\]/g, (_, param: string) => values[param] ?? '');
}
