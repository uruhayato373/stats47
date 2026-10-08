import { SITE } from '@stats47/types';

import tagsJson from '../../../../data/content/tags.json';
import routesJson from '../../../../data/content/routes.json';
import navigationJson from '../../../../data/content/navigation.json';

export interface ContentTag {
  id: string;
  label: string;
  key: string;
  aliases: string[];
}
export interface ContentRoute {
  id: string;
  kind: string;
  pattern: string;
  parameters: string[];
  title?: string;
}
export interface ContentPage {
  id: string;
  kind: string;
  key: string;
  title: string;
  href: string;
  published: boolean;
  rankingKeys?: string[];
  tagIds?: string[];
}
export type ContentRelation = keyof typeof navigationJson.relations;
export interface ContentLink { from: string; to: string; relation: ContentRelation }
export const CONTENT_TAGS: readonly ContentTag[] = tagsJson.tags;
export const CONTENT_ROUTES: readonly ContentRoute[] = routesJson.routes;
export const CONTENT_NAVIGATION = navigationJson;

const tagsByValue = new Map(CONTENT_TAGS.flatMap(tag =>
  [tag.id, tag.key, tag.label, ...tag.aliases].map(value => [value, tag] as const)));

/** 表示名を変えてもIDは変えない。過去の英語URL・日本語キーも同じIDへ解決する。 */
export function resolveContentTag(value: string): ContentTag | undefined {
  return tagsByValue.get(value);
}
export function contentTagIds(values: readonly string[]): string[] {
  return [...new Set(values.flatMap(value => {
    const tag = resolveContentTag(value);
    return tag ? [tag.id] : [];
  }))];
}
export function contentTagKeys(values: readonly string[]): string[] {
  return contentTagIds(values).map(id => resolveContentTag(id)!.key);
}

/** URLのクエリ・フラグメントは同じページID。合成ページもroute契約からIDを得る。 */
export function contentIdFromHref(href: string): string | undefined {
  let pathname: string;
  try { pathname = decodeURIComponent(new URL(href, SITE.origin).pathname).replace(/\/$/, '') || '/'; }
  catch { return undefined; }
  for (const route of CONTENT_ROUTES) {
    const pattern = route.pattern.replace(/\[([^\]]+)\]/g, '([^/]+)');
    const match = pathname.match(new RegExp(`^${pattern}$`));
    if (!match) continue;
    if (route.kind === 'tag') return resolveContentTag(match[1]!)?.id;
    return match.length > 1 ? `${route.kind}:${match.slice(1).join(':')}` : route.id;
  }
  return undefined;
}
