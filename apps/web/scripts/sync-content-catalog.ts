/** 全ページID索引を既存の正本から再生成する。外部への書き込みは行わない。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { METRICS_REGISTRY } from '@stats47/data-configs';
import {
  GEO_ANALYSES,
  GEO_LAYERS,
  BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE,
} from '@stats47/data-configs/business-plan';
import {
  CONTENT_ROUTES,
  CONTENT_TAGS,
  CONTENT_NAVIGATION,
  contentIdFromHref,
  contentTagIds,
  resolveContentTag,
  type ContentPage,
  type ContentLink,
} from '@stats47/data-configs/content';
import {
  KNOWN_MUNICIPALITY_RANKING_KEYS,
  JAPAN_CATALOGS,
  MUNICIPALITY_THEME_CATALOGS,
} from '@stats47/data-configs/geo-scope';
import { AREA_DATABOOK_TEMPLATE, collectTemplateMetricKeys, listTemplateCharts } from '../../../packages/data-configs/src/area-databook';
import { collectChartDependencies } from '../../../packages/data-configs/src/theme-catalog/chart-dependencies';
import { listThemeCatalogs } from '@stats47/data-configs/theme-catalog';
import { KNOWN_RANKING_KEYS } from '@stats47/ranking/config';

import { NOTE_ARTICLES } from '../../../.claude/scripts/note/catalog';
import { buildExternalContentPages, type ExternalSnsSource } from '@stats47/data-configs/content/external';
import { datasetPath, datasetDir } from '../../../config/datasets.mjs';
import cities from '../../../packages/area/src/data/cities.json';
import prefectures from '../../../packages/area/src/data/prefectures.json';
import { CATEGORIES } from '../../../packages/data-configs/src/categories';
import surveys from '../../../packages/ranking/src/data/surveys.json';
import { BLOG_SLUG_REDIRECTS } from '../src/config/blog-redirects';
import { GONE_BLOG_SLUGS } from '../src/config/gone-blog-slugs';
import { KNOWN_TAG_KEYS } from '../src/config/known-tag-keys';
import { KNOWN_THEME_SLUGS } from '../src/config/known-theme-slugs';
import { GEO_CROSS_ANALYSIS_SLUGS } from '../src/features/geo-analysis/lib/geo-cross-analysis';
import { STOREFRONT_PRODUCTS } from '../src/features/products/storefront.generated';
import { AREA_THEMES } from '../src/features/theme-dashboard/config/area-theme-slugs';

async function run() {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..'
  );
  const catalogPath = path.join(root, datasetPath('content.entities'));
  const check = process.argv.includes('--check');
  const blogFile = process.argv
    .find((arg) => arg.startsWith('--blog-snapshot='))
    ?.split('=')
    .slice(1)
    .join('=');
  type BlogEntry = {
    slug: string;
    title: string;
    published: boolean;
    tags: { tagKey: string }[];
    rankingRefs?: { rankingKey: string }[];
    surveyIds?: string[];
  };
  const pagesDir = path.join(root, datasetDir('content.pages'));
  const blogPath = path.join(pagesDir, 'blog.json');
  const previousBlog = fs.existsSync(blogPath)
    ? JSON.parse(fs.readFileSync(blogPath, 'utf8')).pages
    : [];
  const blogEntries: BlogEntry[] | undefined = blogFile
    ? JSON.parse(fs.readFileSync(blogFile, 'utf8').replace(/^\uFEFF/, ''))
        .articles
    : process.argv.includes('--from-r2')
      ? (
          await (
            await import('@stats47/r2-storage/server')
          ).fetchFromR2AsJson<{ articles: BlogEntry[] }>('app/blog/all.json')
        )?.articles
      : undefined;
  if (process.argv.includes('--from-r2') && !blogEntries?.length)
    throw new Error('blog snapshotを取得できません。索引を更新しません。');
  const pages: ContentPage[] = [];
  const links: ContentLink[] = [];
  const add = (page: ContentPage) => pages.push(page);
  const link = (from: string, to: string, relation: ContentLink['relation']) =>
    links.push({ from, to, relation });

  for (const route of CONTENT_ROUTES.filter(
    (route) => route.parameters.length === 0 && route.kind === 'page'
  )) {
    add({
      id: route.id,
      kind: 'page',
      key: route.pattern,
      href: route.pattern,
      title: route.title ?? route.pattern,
      published: true,
    });
  }
  for (const metric of Object.values(METRICS_REGISTRY)) {
    add({
      id: `ranking:${metric.key}`,
      kind: 'ranking',
      key: metric.key,
      title: metric.title,
      href: `/ranking/${metric.key}`,
      published:
        metric.isActive !== false && KNOWN_RANKING_KEYS.has(metric.key),
    });
    if (metric.entities.includes('city'))
      add({
        id: `municipality-ranking:${metric.key}`,
        kind: 'municipality-ranking',
        key: metric.key,
        title: metric.title,
        href: `/municipalities/ranking/${metric.key}`,
        published: KNOWN_MUNICIPALITY_RANKING_KEYS.has(metric.key),
      });
  }
  for (const theme of listThemeCatalogs()) {
    const rankingKeys = [
      ...new Set(
        [...theme.metrics.map(metric => metric.rankingKey), ...theme.charts.flatMap(chart => collectChartDependencies(chart).metricRefs.map(ref => ref.metricKey)), ...(theme.metricGroups ?? []).flatMap(group => group.rankingKeys)]
      ),
    ];
    add({
      id: `theme:${theme.key}`,
      kind: 'theme',
      key: theme.key,
      title: theme.title,
      href: `/themes/${theme.key}`,
      published: KNOWN_THEME_SLUGS.has(theme.key),
      rankingKeys,
    });
    for (const key of rankingKeys)
      link(`ranking:${key}`, `theme:${theme.key}`, 'contains');
  }
  for (const pref of prefectures) {
    add({
      id: `area:${pref.prefCode}`,
      kind: 'area',
      key: pref.prefCode,
      title: pref.prefName,
      href: `/areas/${pref.prefCode}`,
      rankingKeys: [...new Set([...collectTemplateMetricKeys(AREA_DATABOOK_TEMPLATE), ...listTemplateCharts(AREA_DATABOOK_TEMPLATE).flatMap(({chart}) => chart.relatedRankingKeys ?? [])])].sort(),
      published: true,
    });
    for (const theme of AREA_THEMES)
      add({
        id: `area-theme:${pref.prefCode}:${theme.themeKey}`,
        kind: 'area-theme',
        key: `${pref.prefCode}:${theme.themeKey}`,
        title: `${pref.prefName}の${theme.title}`,
        href: `/areas/${pref.prefCode}/${theme.themeKey}`,
        published: true,
        rankingKeys: theme.rankingKeys,
      });
  }
  for (const city of cities) {
    const prefCode = city.cityCode.slice(0, 2) + '000';
    add({
      id: `city:${prefCode}:${city.cityCode}`,
      kind: 'city',
      key: city.cityCode,
      title: city.cityName,
      href: `/areas/${prefCode}/cities/${city.cityCode}`,
      published: city.level !== '3',
    });
  }
  for (const theme of Object.values(JAPAN_CATALOGS))
    add({
      id: `japan-theme:${theme.themeSlug}`,
      kind: 'japan-theme',
      key: theme.themeSlug,
      title: `日本の${theme.title}`,
      href: `/japan/${theme.themeSlug}`,
      rankingKeys: theme.metrics.map(metric => metric.metricKey),
      published: true,
    });
  for (const theme of Object.values(MUNICIPALITY_THEME_CATALOGS))
    add({
      id: `municipality-theme:${theme.slug}`,
      kind: 'municipality-theme',
      key: theme.slug,
      title: theme.title,
      href: `/municipalities/themes/${theme.slug}`,
      rankingKeys: [...theme.metricKeys],
      published: true,
    });
  for (const product of STOREFRONT_PRODUCTS)
    add({
      id: `product:${product.slug}`,
      kind: 'product',
      key: product.slug,
      title: product.title,
      href: `/products/${product.slug}`,
      published: true,
    });
  for (const category of CATEGORIES)
    add({
      id: `category:${category.categoryKey}`,
      kind: 'category',
      key: category.categoryKey,
      title: category.categoryName,
      href: `/category/${category.categoryKey}`,
      published: true,
    });
  for (const survey of surveys)
    add({
      id: `survey:${survey.id}`,
      kind: 'survey',
      key: survey.id,
      title: survey.name,
      href: `/survey/${survey.id}`,
      published: survey.isActive,
    });
  for (const tag of CONTENT_TAGS)
    add({
      id: tag.id,
      kind: 'tag',
      key: tag.key,
      title: tag.label,
      href: `/tag/${encodeURIComponent(tag.key)}`,
      published: KNOWN_TAG_KEYS.has(tag.key),
    });
  for (const layer of GEO_LAYERS)
    add({
      id: `geo-layer:${layer.slug}`,
      kind: 'geo-layer',
      key: layer.slug,
      title: layer.name,
      href: `/geo/layers/${layer.slug}`,
      published: true,
    });
  for (const analysis of GEO_ANALYSES) {
    const id = `geo:${analysis.slug}`;
    add({
      id,
      kind: 'geo',
      key: analysis.slug,
      title: analysis.title,
      href: `/geo/${analysis.slug}`,
      rankingKeys: 'relatedRankingKey' in analysis && analysis.relatedRankingKey ? [analysis.relatedRankingKey] : [],
      published:
        analysis.status === 'ready' &&
        GEO_CROSS_ANALYSIS_SLUGS.includes(
          analysis.slug as (typeof GEO_CROSS_ANALYSIS_SLUGS)[number]
        ),
    });
    if ('relatedRankingKey' in analysis && analysis.relatedRankingKey) {
      link(`ranking:${analysis.relatedRankingKey}`, id, 'geo');
      link(id, `ranking:${analysis.relatedRankingKey}`, 'uses');
    }
    const lifecycle = BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE.find(
      (item) => item.analysisSlug === analysis.slug
    );
    if (lifecycle) {
      link(id, `blog:${lifecycle.editorial.blogSlug}`, 'explains');
      link(`blog:${lifecycle.editorial.blogSlug}`, id, 'geo');
      for (const key of lifecycle.themeKeys) {
        link(`theme:${key}`, id, 'geo');
        link(id, `theme:${key}`, 'themeContext');
      }
    }
  }
  if (blogEntries) {
    for (const article of blogEntries) {
      const unknown = article.tags.filter(
        (tag) => !resolveContentTag(tag.tagKey)
      );
      if (unknown.length)
        throw new Error(
          `未登録タグ: ${article.slug}: ${unknown.map((tag) => tag.tagKey).join(', ')}`
        );
      add({
        id: `blog:${article.slug}`,
        kind: 'blog',
        key: article.slug,
        title: article.title,
        href: `/blog/${article.slug}`,
        published:
          article.published &&
          !GONE_BLOG_SLUGS.has(article.slug) &&
          !(article.slug in BLOG_SLUG_REDIRECTS),
        rankingKeys: (article.rankingRefs ?? []).map((ref) => ref.rankingKey),
        tagIds: contentTagIds(article.tags.map((tag) => tag.tagKey)),
      });
    }
  } else pages.push(...previousBlog);

  const allIds = new Set(pages.map((page) => page.id));
  // 終了記事・企画中の記事への関係は公開導線に出さない。未公開の企画関係はlifecycle側に残る。
  const generatedLinks = links.filter(
    (edge) => allIds.has(edge.from) && allIds.has(edge.to)
  );
  for (const edge of CONTENT_NAVIGATION.links as ContentLink[]) {
    if (!allIds.has(edge.from) || !allIds.has(edge.to))
      throw new Error(`未登録IDの回遊関係: ${JSON.stringify(edge)}`);
  }
  const groups = new Map<string, ContentPage[]>();
  for (const page of pages.sort((a, b) => a.id.localeCompare(b.id))) {
    const key =
      page.kind === 'area-theme'
        ? `area-theme-${page.key.split(':')[0]}`
        : page.kind;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(page);
  }
  if (!check) fs.mkdirSync(pagesDir, { recursive: true });
  const shards = [...groups].map(([key, rows]) => {
    const shardPath = path.join(pagesDir, `${key}.json`);
    const content = JSON.stringify({ version: 1, pages: rows }, null, 2) + '\n';
    if (Buffer.byteLength(content) > 1024 * 1024)
      throw new Error(`ID索引をさらに分割してください: ${key}`);
    if (check) {
      if (
        !fs.existsSync(shardPath) ||
        fs.readFileSync(shardPath, 'utf8') !== content
      )
        throw new Error(`ID索引が古い状態です: ${key}`);
    } else fs.writeFileSync(shardPath, content);
    return { key, kind: rows[0]!.kind, count: rows.length };
  });
  const expectedFiles = new Set(shards.map((shard) => `${shard.key}.json`));
  for (const file of fs.readdirSync(pagesDir)) {
    if (expectedFiles.has(file)) continue;
    if (!/^[a-z0-9-]+\.json$/.test(file))
      throw new Error(`ID索引に不明なファイル: ${file}`);
    if (check) throw new Error(`ID索引に不要な生成物: ${file}`);
    fs.unlinkSync(path.join(pagesDir, file));
  }
  const catalog = {
    version: 1,
    shards,
    links: generatedLinks.sort((a, b) =>
      `${a.from}:${a.to}`.localeCompare(`${b.from}:${b.to}`)
    ),
  };
  const serialized = JSON.stringify(catalog, null, 2) + '\n';
  if (check) {
    if (serialized !== fs.readFileSync(catalogPath, 'utf8'))
      throw new Error(
        'ページID索引が古い状態です。npm run content:sync を実行してください。'
      );
  } else fs.writeFileSync(catalogPath, serialized);
  // stats47 の外の公開物 (note・SNS) は別ファイルに置く。SNS の投稿台帳は CI が投稿のたびに書き換えるので、
  // サイトの台帳 (entities.json / pages/) と鮮度の検査に混ぜない。--check では書かず、形と参照の整合は
  // validate-content-catalog.ts が見る (2026-10-10)。
  const externalPath = path.join(root, datasetPath('content.external'));
  const snsPosts = (JSON.parse(fs.readFileSync(path.join(root, datasetPath('sns.posts')), 'utf8')) as { posts: ExternalSnsSource[] }).posts;
  const external = buildExternalContentPages({
    notes: NOTE_ARTICLES,
    posts: snsPosts,
    isKnownMetric: (key) => Boolean(METRICS_REGISTRY[key]),
    idFromHref: contentIdFromHref,
  });
  const externalLinks = external.links
    .filter((edge) => allIds.has(edge.to))
    .sort((a, b) => `${a.from}:${a.to}`.localeCompare(`${b.from}:${b.to}`));
  if (!check)
    fs.writeFileSync(
      externalPath,
      JSON.stringify({ version: 1, pages: external.pages.sort((a, b) => a.id.localeCompare(b.id)), links: externalLinks }, null, 2) + '\n'
    );
  console.log(
    `content catalog: ${pages.length} pages, ${CONTENT_ROUTES.length} routes, ${CONTENT_TAGS.length} tags, ${generatedLinks.length} relations (${check ? 'checked' : 'generated'})` +
      `; external: ${external.pages.length} (note・SNS)${check ? ' (鮮度は見ない)' : ''}`
  );
}
void run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
