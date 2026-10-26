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
  city: 'route:city:areaCode:cityCode',
  blog: 'route:blog:slug',
  tag: 'route:tag:tagKey',
  category: 'route:category:categoryKey',
  'category-compare': 'route:category-compare:categoryKey',
  survey: 'route:survey:surveyKey',
  'municipality-ranking': 'route:municipality-ranking:rankingKey',
  'municipality-theme': 'route:municipality-theme:themeSlug',
  'japan-theme': 'route:japan-theme:themeSlug',
  geo: 'route:geo:analysisSlug',
  'geo-layer': 'route:geo-layer:layerSlug',
  'geo-datasets': 'route:geo-datasets:dataId',
  product: 'route:product:slug',
} as const;

export type HrefRouteName = keyof typeof HREF_ROUTE_IDS;

/** route id の末尾 (`route:<kind>:<p1>:<p2>`) からパラメータ名を型で取り出す */
type ParamNames<Id extends string> = Id extends `route:${string}:${infer Rest}` ? SplitParams<Rest> : never;
type SplitParams<S extends string> = S extends `${infer Head}:${infer Tail}` ? Head | SplitParams<Tail> : S;

export type HrefParams<Name extends HrefRouteName> = Record<ParamNames<(typeof HREF_ROUTE_IDS)[Name]>, string>;

const PATTERN_BY_ID = new Map(routesJson.routes.map((route) => [route.id, route.pattern] as const));

/** テスト用: 名前 → route id の対応 (routes.json と食い違わないことを検査する) */
export const HREF_ROUTES: Readonly<Record<HrefRouteName, string>> = HREF_ROUTE_IDS;

export function hrefFor<Name extends HrefRouteName>(name: Name, params: HrefParams<Name>): string {
  const id = HREF_ROUTE_IDS[name];
  const pattern = PATTERN_BY_ID.get(id);
  if (!pattern) throw new Error(`routes.json に ${id} がない`);
  const values = params as Record<string, string>;
  // 描画中に例外を出さない (置き換え前のテンプレート文字列と同じく値をそのまま埋める)
  return pattern.replace(/\[([^\]]+)\]/g, (_, param: string) => values[param] ?? '');
}
