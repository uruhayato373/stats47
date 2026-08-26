#!/usr/bin/env tsx

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { KNOWN_RANKING_KEYS } from '../../../packages/ranking/src/config/known-ranking-keys';
import { ALL_THEMES } from '../src/features/theme-dashboard/config/all-themes';

import {
  auditPublicDataContracts,
  type BlogContractExpectation,
  type ContractFetch,
  type PublicDataContractInput,
} from './lib/public-data-contract';

const DEFAULT_BASE_URL = 'https://storage.stats47.jp';
const DEFAULT_CONCURRENCY = 16;
const RETRY_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 30_000;

interface BlogManifestArticle {
  readonly slug?: unknown;
  readonly published?: unknown;
}

interface BlogManifest {
  readonly articles?: unknown;
}

interface CliOptions {
  readonly baseUrl: string;
  readonly concurrency: number;
  readonly limitRankings?: number;
  readonly limitBlogs?: number;
  readonly jsonPath?: string;
}

function readOption(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function positiveInteger(
  value: string | undefined,
  name: string
): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function parseOptions(args: readonly string[]): CliOptions {
  return {
    baseUrl: (
      readOption(args, '--base-url') ??
      process.env.R2_PUBLIC_FETCH_URL ??
      DEFAULT_BASE_URL
    ).replace(/\/+$/, ''),
    concurrency:
      positiveInteger(readOption(args, '--concurrency'), '--concurrency') ??
      DEFAULT_CONCURRENCY,
    limitRankings: positiveInteger(
      readOption(args, '--limit-rankings'),
      '--limit-rankings'
    ),
    limitBlogs: positiveInteger(
      readOption(args, '--limit-blogs'),
      '--limit-blogs'
    ),
    jsonPath: readOption(args, '--json'),
  };
}

function shouldRetry(response: Response): boolean {
  return response.status === 429 || response.status >= 500;
}

function createRetryingFetch(): ContractFetch {
  return async (url) => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: { 'user-agent': 'stats47-public-data-contract-audit/1.0' },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!shouldRetry(response) || attempt === RETRY_ATTEMPTS)
          return response;
      } catch (error) {
        lastError = error;
        if (attempt === RETRY_ATTEMPTS) throw error;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, 250 * 2 ** (attempt - 1))
      );
    }
    throw lastError instanceof Error ? lastError : new Error('request failed');
  };
}

async function loadPublishedBlogs(
  baseUrl: string,
  fetcher: ContractFetch
): Promise<readonly BlogContractExpectation[]> {
  const resource = `${baseUrl}/app/blog/all.json`;
  const response = await fetcher(resource);
  if (!response.ok)
    throw new Error(`blog manifest HTTP ${response.status}: ${resource}`);
  const manifest = (await response.json()) as BlogManifest;
  if (!Array.isArray(manifest.articles)) {
    throw new Error('blog manifest articles must be an array');
  }
  const blogs: BlogContractExpectation[] = [];
  for (const rawArticle of manifest.articles) {
    if (typeof rawArticle !== 'object' || rawArticle === null) {
      throw new Error('blog manifest article must be an object');
    }
    const article = rawArticle as BlogManifestArticle;
    if (article.published === false) continue;
    if (typeof article.slug !== 'string' || article.slug.length === 0) {
      throw new Error('published blog manifest article has no slug');
    }
    blogs.push({ slug: article.slug });
  }
  return blogs.sort((left, right) => left.slug.localeCompare(right.slug));
}

async function collectExpectations(
  options: CliOptions
): Promise<PublicDataContractInput> {
  const fetcher = createRetryingFetch();
  const rankings = [...KNOWN_RANKING_KEYS]
    .sort()
    .map((rankingKey) => ({ rankingKey, areaType: 'prefecture' as const }));
  const themes = ALL_THEMES.map((theme) => ({
    themeKey: theme.themeKey,
    rankingKeys: [
      ...new Set([
        ...theme.rankingKeys,
        ...theme.tabIndicators.map((indicator) => indicator.rankingKey),
      ]),
    ].sort(),
    areaType: 'prefecture' as const,
  }));
  const blogs = await loadPublishedBlogs(options.baseUrl, fetcher);
  return {
    rankings: options.limitRankings
      ? rankings.slice(0, options.limitRankings)
      : rankings,
    themes,
    blogs: options.limitBlogs ? blogs.slice(0, options.limitBlogs) : blogs,
  };
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const input = await collectExpectations(options);
  const result = await auditPublicDataContracts(input, {
    baseUrl: options.baseUrl,
    concurrency: options.concurrency,
    fetcher: createRetryingFetch(),
  });
  const report = {
    schemaVersion: 1,
    auditedAt: new Date().toISOString(),
    baseUrl: options.baseUrl,
    expected: {
      knownRankings: input.rankings.length,
      themes: input.themes.length,
      publishedBlogs: input.blogs.length,
    },
    checked: result.checked,
    countsByKind: Object.fromEntries(
      [...new Set(result.findings.map((finding) => finding.kind))]
        .sort()
        .map((kind) => [
          kind,
          result.findings.filter((finding) => finding.kind === kind).length,
        ])
    ),
    findings: result.findings,
  };

  if (options.jsonPath) {
    const outputPath = path.resolve(options.jsonPath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  console.log(
    `public-data-contract: rankings=${result.checked.rankings} ` +
      `themeRefs=${result.checked.themeReferences} blogs=${result.checked.blogs} ` +
      `assets=${result.checked.blogAssets} findings=${result.findings.length}`
  );
  for (const item of result.findings.slice(0, 50)) {
    console.error(
      `[${item.kind}] ${item.owner}:${item.subject} ${item.resource} — ${item.detail}`
    );
  }
  if (result.findings.length > 50) {
    console.error(
      `… ${result.findings.length - 50} additional findings (use --json)`
    );
  }
  if (result.findings.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`public-data-contract audit failed: ${String(error)}`);
  process.exitCode = 1;
});
