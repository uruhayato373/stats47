#!/usr/bin/env tsx

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import {
  createCodexMcpImagegenRequest,
  ingestCodexBackgroundAsset,
  validateCodexBackgroundCatalog,
} from './lib/blog-codex-background-workflow';
import {
  parseBlogArticleImageContext,
} from './lib/blog-article-background';
import { createFullbleedImagegenRequest, ingestFullbleedBackgroundAsset, hasLocalArticleBackground } from './lib/blog-fullbleed-background';
import { BLOG_CODEX_BACKGROUND_BY_SLUG } from './data/blog-codex-background-catalog';
import { SITE } from '@stats47/types';

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, '../../..');
const PUBLIC_URL =
  process.env.R2_PUBLIC_FETCH_URL ?? SITE.r2PublicBaseUrl;

function stringArg(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  const value = index >= 0 ? args[index + 1] : null;
  return value && !value.startsWith('--') ? value : null;
}

function requiredArg(args: string[], flag: string): string {
  const value = stringArg(args, flag);
  if (!value) throw new Error(`${flag} が必要です`);
  return value;
}

function assertSlug(slug: string): void {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error(`slugが不正です: ${slug}`);
  }
}

async function fetchText(path: string): Promise<string> {
  const response = await fetch(`${PUBLIC_URL}/${path}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.text();
}

async function loadArticleMarkdown(
  slug: string,
  args: string[]
): Promise<string> {
  const articlePath = stringArg(args, '--article');
  return articlePath
    ? readFileSync(resolve(articlePath), 'utf8')
    : fetchText(`app/blog/${slug}/article.md`);
}

function writeArticleRequest(
  slug: string,
  markdown: string
): ReturnType<typeof createFullbleedImagegenRequest> {
  const request = createFullbleedImagegenRequest(
    parseBlogArticleImageContext(slug, markdown)
  );
  const requestPath = join(
    PROJECT_ROOT,
    '.local/blog-imagegen/requests',
    `${slug}.json`
  );
  mkdirSync(dirname(requestPath), { recursive: true });
  writeFileSync(requestPath, `${JSON.stringify(request, null, 2)}\n`);
  return request;
}

async function createArticleQueue(force: boolean): Promise<void> {
  const raw = JSON.parse(await fetchText('app/blog/all.json')) as unknown;
  const articles = Array.isArray(raw)
    ? raw
    : (raw as { articles?: unknown[] }).articles;
  if (!Array.isArray(articles)) throw new Error('app/blog/all.json schema不正');
  const published = articles.filter(
    (article): article is { slug: string; published: boolean } =>
      Boolean(
        article &&
          typeof article === 'object' &&
          (article as { published?: unknown }).published === true &&
          typeof (article as { slug?: unknown }).slug === 'string'
      )
  );
  const states = await Promise.all(
    published.map(async ({ slug }) => {
      assertSlug(slug);
      const manifest = JSON.parse(
        await fetchText(`app/blog/${slug}/ogp/generation.json`)
      ) as { metadata?: { background?: { source?: string; sha256?: string } } };
      return {
        slug,
        source: manifest.metadata?.background?.source ?? null,
        sha256: manifest.metadata?.background?.sha256 ?? null,
      };
    })
  );
  const targets = states.filter((state) => {
    const localExists = hasLocalArticleBackground(PROJECT_ROOT, state.slug) || Boolean(BLOG_CODEX_BACKGROUND_BY_SLUG[state.slug]);
    // Even --force must not replace an existing article illustration.
    return !localExists && !(state.source === 'ai' && state.sha256) &&
      (force || state.source === 'shared' || !state.sha256);
  });
  const requests = [];
  for (const { slug } of targets) {
    requests.push(
      writeArticleRequest(
        slug,
        await fetchText(`app/blog/${slug}/article.md`)
      )
    );
  }
  const queuePath = join(PROJECT_ROOT, '.local/blog-imagegen/queue.json');
  mkdirSync(dirname(queuePath), { recursive: true });
  writeFileSync(
    queuePath,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        totalPublished: published.length,
        requests,
      },
      null,
      2
    )}\n`
  );
  console.log(
    JSON.stringify(
      {
        queuePath: queuePath.slice(PROJECT_ROOT.length + 1),
        totalPublished: published.length,
        targets: requests.length,
      },
      null,
      2
    )
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'request') {
    const slug = requiredArg(args, '--slug');
    assertSlug(slug);
    const request = createCodexMcpImagegenRequest(slug);
    const requestPath = join(
      PROJECT_ROOT,
      '.local/blog-imagegen/requests',
      `${slug}.json`
    );
    mkdirSync(dirname(requestPath), { recursive: true });
    writeFileSync(requestPath, `${JSON.stringify(request, null, 2)}\n`);
    console.log(
      JSON.stringify(
        {
          requestPath: requestPath.slice(PROJECT_ROOT.length + 1),
          request,
        },
        null,
        2
      )
    );
    return;
  }

  if (command === 'request-article') {
    const slug = requiredArg(args, '--slug');
    assertSlug(slug);
    const request = writeArticleRequest(
      slug,
      await loadArticleMarkdown(slug, args)
    );
    console.log(JSON.stringify(request, null, 2));
    return;
  }

  if (command === 'queue') {
    await createArticleQueue(args.includes('--force'));
    return;
  }

  if (command === 'ingest') {
    const slug = requiredArg(args, '--slug');
    assertSlug(slug);
    const result = await ingestCodexBackgroundAsset({
      projectRoot: PROJECT_ROOT,
      slug,
      inputPath: resolve(requiredArg(args, '--input')),
      promptHash: requiredArg(args, '--prompt-hash'),
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'ingest-article') {
    const slug = requiredArg(args, '--slug');
    assertSlug(slug);
    const context = parseBlogArticleImageContext(
      slug,
      await loadArticleMarkdown(slug, args)
    );
    const result = await ingestFullbleedBackgroundAsset({
      projectRoot: PROJECT_ROOT,
      context,
      inputPath: resolve(requiredArg(args, '--input')),
      promptHash: requiredArg(args, '--prompt-hash'),
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'check') {
    const codex = await validateCodexBackgroundCatalog(PROJECT_ROOT);
    console.log(JSON.stringify({ codex }, null, 2));
    return;
  }

  throw new Error(
    '使い方: manage-blog-codex-backgrounds.ts ' +
      '<request-article --slug SLUG [--article PATH] | queue [--force] | ' +
      'ingest-article --slug SLUG --input PATH --prompt-hash HASH [--article PATH] | ' +
      'request --slug SLUG | ingest --slug SLUG --input PATH --prompt-hash HASH | check>'
  );
}

main().catch((error) => {
  console.error(
    `Fatal: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
