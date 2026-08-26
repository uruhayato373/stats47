import { describe, expect, it } from 'vitest';

import {
  auditPublicDataContracts,
  type ContractFetch,
  type PublicDataContractInput,
} from '../public-data-contract';

const BASE_URL = 'https://storage.example.test';

function validItem(rankingKey: string, areaType = 'prefecture'): unknown {
  return {
    generatedAt: '2026-08-26T00:00:00.000Z',
    item: {
      rankingKey,
      areaType,
      latestYear: { yearCode: '2024', yearName: '2024年' },
    },
  };
}

function validValues(rankingKey: string, areaType = 'prefecture'): unknown {
  return {
    generatedAt: '2026-08-26T00:00:00.000Z',
    rankingKey,
    areaType,
    partitions: [
      {
        yearCode: '2024',
        count: 1,
        values: [
          {
            metricKey: rankingKey,
            areaType,
            areaCode: '01000',
            areaName: '北海道',
            yearCode: '2024',
            yearName: '2024年',
            value: 1,
            unit: '件',
            rank: 1,
          },
        ],
      },
    ],
  };
}

function response(value: unknown, status = 200): Response {
  return new Response(
    typeof value === 'string' ? value : JSON.stringify(value),
    {
      status,
      headers: {
        'content-type':
          typeof value === 'string' ? 'text/plain' : 'application/json',
      },
    }
  );
}

function routeFetcher(
  routes: Readonly<Record<string, Response>>
): ContractFetch {
  return async (url) =>
    routes[new URL(url).pathname] ?? response('not found', 404);
}

function input(
  overrides: Partial<PublicDataContractInput> = {}
): PublicDataContractInput {
  return {
    rankings: [{ rankingKey: 'metric-a', areaType: 'prefecture' }],
    themes: [],
    blogs: [],
    ...overrides,
  };
}

function rankingRoutes(rankingKey: string): Record<string, Response> {
  return {
    [`/app/ranking/${rankingKey}/item.json`]: response(validItem(rankingKey)),
    [`/app/ranking/${rankingKey}/values.json`]: response(
      validValues(rankingKey)
    ),
  };
}

describe('public data contract audit defect fixtures', () => {
  it('detects a missing ranking payload', async () => {
    const result = await auditPublicDataContracts(input(), {
      baseUrl: BASE_URL,
      fetcher: routeFetcher({
        '/app/ranking/metric-a/item.json': response(validItem('metric-a')),
      }),
    });

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: 'missing',
        owner: 'ranking',
        subject: 'metric-a',
      })
    );
  });

  it('detects an empty values payload', async () => {
    const result = await auditPublicDataContracts(input(), {
      baseUrl: BASE_URL,
      fetcher: routeFetcher({
        '/app/ranking/metric-a/item.json': response(validItem('metric-a')),
        '/app/ranking/metric-a/values.json': response({
          rankingKey: 'metric-a',
          areaType: 'prefecture',
          partitions: [],
        }),
      }),
    });

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: 'empty',
        owner: 'ranking',
        subject: 'metric-a',
      })
    );
  });

  it('detects a wrong area type', async () => {
    const result = await auditPublicDataContracts(input(), {
      baseUrl: BASE_URL,
      fetcher: routeFetcher({
        '/app/ranking/metric-a/item.json': response(
          validItem('metric-a', 'city')
        ),
        '/app/ranking/metric-a/values.json': response(
          validValues('metric-a', 'city')
        ),
      }),
    });

    expect(
      result.findings.filter((finding) => finding.kind === 'area-type')
    ).toHaveLength(3);
  });

  it('detects an asset referenced only from an article body', async () => {
    const result = await auditPublicDataContracts(
      input({ rankings: [], blogs: [{ slug: 'article-a' }] }),
      {
        baseUrl: BASE_URL,
        fetcher: routeFetcher({
          '/app/blog/article-a/article.md': response(
            '本文だけの参照 ![図](data/body-only.svg)'
          ),
        }),
      }
    );

    expect(result.checked.blogAssets).toBe(1);
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: 'missing',
        owner: 'blog',
        resource: 'app/blog/article-a/data/body-only.svg',
      })
    );
  });

  it('rejects a theme when one referenced ranking falls through partial fallback', async () => {
    const result = await auditPublicDataContracts(
      input({
        rankings: [],
        themes: [
          {
            themeKey: 'theme-a',
            rankingKeys: ['metric-a', 'metric-b'],
            areaType: 'prefecture',
          },
        ],
      }),
      {
        baseUrl: BASE_URL,
        fetcher: routeFetcher(rankingRoutes('metric-a')),
      }
    );

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        owner: 'theme',
        subject: 'theme-a',
        resource: 'metric-b',
      })
    );
  });

  it('keeps transient reachability failures distinct from confirmed missing data', async () => {
    const result = await auditPublicDataContracts(input(), {
      baseUrl: BASE_URL,
      fetcher: routeFetcher({
        '/app/ranking/metric-a/item.json': response('temporary', 503),
      }),
    });

    expect(result.findings).toContainEqual(
      expect.objectContaining({ kind: 'transient', owner: 'ranking' })
    );
    expect(result.findings).not.toContainEqual(
      expect.objectContaining({ kind: 'missing' })
    );
  });
});
