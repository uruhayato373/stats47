import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CONTENT_ROUTES,
  CONTENT_TAGS,
  CONTENT_NAVIGATION,
  contentIdFromHref,
  type ContentPage,
} from '@stats47/data-configs/content';
import Ajv from 'ajv';

import { datasetPath, datasetDir } from '../../../config/datasets.mjs';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const ajv = new Ajv({ allErrors: true });
for (const name of ['tags', 'routes', 'entities', 'navigation']) {
  const schema = JSON.parse(
    fs.readFileSync(
      path.join(root, datasetDir('content.schema'), `${name}.schema.json`),
      'utf8'
    )
  );
  const value = JSON.parse(
    fs.readFileSync(path.join(root, datasetPath(`content.${name}`)), 'utf8')
  );
  const validate = ajv.compile(schema);
  if (!validate(value))
    throw new Error(`${name}: ${ajv.errorsText(validate.errors)}`);
}
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, datasetPath('content.entities')), 'utf8')
) as {
  shards: { key: string; kind: string; count: number }[];
  links: { from: string; to: string }[];
};
const validatePages = ajv.compile(
  JSON.parse(
    fs.readFileSync(
      path.join(root, datasetDir('content.schema'), 'pages.schema.json'),
      'utf8'
    )
  )
);
const pages = manifest.shards.flatMap((shard) => {
  const value = JSON.parse(
    fs.readFileSync(
      path.join(root, datasetDir('content.pages'), `${shard.key}.json`),
      'utf8'
    )
  );
  if (!validatePages(value))
    throw new Error(`${shard.key}: ${ajv.errorsText(validatePages.errors)}`);
  const rows = value.pages as ContentPage[];
  if (
    rows.length !== shard.count ||
    rows.some((row) => row.kind !== shard.kind)
  )
    throw new Error(`分割索引の不一致: ${shard.key}`);
  return rows;
});
const catalog = { pages, links: manifest.links };
const unique = (values: string[], name: string) => {
  if (new Set(values).size !== values.length) throw new Error(`重複 ${name}`);
};
unique(
  CONTENT_TAGS.map((tag) => tag.id),
  'tag id'
);
unique(
  CONTENT_TAGS.map((tag) => tag.key),
  'tag key'
);
unique(
  CONTENT_ROUTES.map((route) => route.id),
  'route id'
);
unique(
  catalog.pages.map((page) => page.id),
  'page id'
);
unique(
  catalog.pages.map((page) => page.href),
  'canonical href'
);
const aliasOwners = new Map<string, string>();
for (const tag of CONTENT_TAGS)
  for (const value of [tag.id, tag.key, tag.label, ...tag.aliases]) {
    if (aliasOwners.has(value) && aliasOwners.get(value) !== tag.id)
      throw new Error(`別名の衝突: ${value}`);
    aliasOwners.set(value, tag.id);
  }
const ids = new Set(catalog.pages.map((page) => page.id));
for (const page of catalog.pages) {
  if (contentIdFromHref(page.href) !== page.id)
    throw new Error(
      `URLとIDの不一致: ${page.id} ${page.href} (${contentIdFromHref(page.href)})`
    );
  for (const id of page.tagIds ?? [])
    if (!ids.has(id)) throw new Error(`未登録タグID: ${id}`);
}
for (const edge of [...catalog.links, ...CONTENT_NAVIGATION.links]) {
  if (!ids.has(edge.from) || !ids.has(edge.to))
    throw new Error(`未登録関係: ${JSON.stringify(edge)}`);
  if (edge.from === edge.to) throw new Error(`自己参照: ${edge.from}`);
}
for (const id of Object.values(CONTENT_NAVIGATION.categoryTags))
  if (!ids.has(id)) throw new Error(`未登録分類対応: ${id}`);
for (const tagIds of Object.values(
  CONTENT_NAVIGATION.excludedArticleTagIdsByKind
)) {
  for (const id of tagIds)
    if (!ids.has(id)) throw new Error(`未登録選択ルール: ${id}`);
}
function pagesIn(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? pagesIn(path.join(dir, entry.name))
        : entry.name === 'page.tsx'
          ? [path.dirname(path.join(dir, entry.name))]
          : []
    );
}
const appRoot = path.join(root, 'apps/web/src/app');
const patterns = pagesIn(appRoot)
  .map((dir) => '/' + path.relative(appRoot, dir).replaceAll('\\', '/'))
  .sort();
if (
  JSON.stringify(patterns) !==
  JSON.stringify(CONTENT_ROUTES.map((route) => route.pattern).sort())
)
  throw new Error('全page.tsxとIDルート台帳が一致しません');
console.log(
  `content validation: ${catalog.pages.length} IDs, ${patterns.length} route families: PASS`
);
