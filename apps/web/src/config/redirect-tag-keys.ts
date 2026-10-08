import { CONTENT_TAGS } from '@stats47/data-configs/content';

/** 別名と現在のURLキーはタグの正本から派生する。既存の301を保持する。 */
export const REDIRECT_TAG_KEYS = new Map<string, string>(
  CONTENT_TAGS.flatMap(tag => tag.aliases.filter(alias => alias !== tag.key).map(alias => [alias, tag.key] as const)),
);
