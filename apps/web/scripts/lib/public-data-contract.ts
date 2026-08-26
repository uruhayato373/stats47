export type PublicDataAreaType = 'national' | 'prefecture' | 'city' | 'port';

export interface RankingContractExpectation {
  readonly rankingKey: string;
  readonly areaType: PublicDataAreaType;
}

export interface ThemeContractExpectation {
  readonly themeKey: string;
  readonly rankingKeys: readonly string[];
  readonly areaType: PublicDataAreaType;
}

export interface BlogContractExpectation {
  readonly slug: string;
}

export interface PublicDataContractInput {
  readonly rankings: readonly RankingContractExpectation[];
  readonly themes: readonly ThemeContractExpectation[];
  readonly blogs: readonly BlogContractExpectation[];
}

export type ContractFailureKind =
  'missing' | 'empty' | 'schema' | 'area-type' | 'year' | 'transient';

export interface ContractFinding {
  readonly kind: ContractFailureKind;
  readonly owner: 'ranking' | 'theme' | 'blog';
  readonly subject: string;
  readonly resource: string;
  readonly detail: string;
}

export interface ContractAuditResult {
  readonly findings: readonly ContractFinding[];
  readonly checked: {
    readonly rankings: number;
    readonly themeReferences: number;
    readonly blogs: number;
    readonly blogAssets: number;
  };
}

export type ContractFetch = (url: string) => Promise<Response>;

interface RankingOutcome {
  readonly findings: readonly ContractFinding[];
  readonly isUsable: boolean;
}

const ASSET_EXTENSIONS = 'svg|png|jpe?g|webp|gif|avif';
const MARKDOWN_ASSET_PATTERN = new RegExp(
  String.raw`!\[[^\]]*\]\(([^)]+\.(?:${ASSET_EXTENSIONS})(?:\?[^)]*)?)\)`,
  'gi'
);
const HTML_ASSET_PATTERN = new RegExp(
  String.raw`\b(?:src|href)=["']([^"']+\.(?:${ASSET_EXTENSIONS})(?:\?[^"']*)?)["']`,
  'gi'
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finding(
  kind: ContractFailureKind,
  owner: ContractFinding['owner'],
  subject: string,
  resource: string,
  detail: string
): ContractFinding {
  return { kind, owner, subject, resource, detail };
}

function responseFailureKind(status: number): ContractFailureKind {
  if (status === 404 || status === 410) return 'missing';
  if (status === 429 || status >= 500) return 'transient';
  return 'schema';
}

async function fetchJson(
  fetcher: ContractFetch,
  url: string
): Promise<{
  readonly value?: unknown;
  readonly failure?: ContractFailureKind;
  readonly detail?: string;
}> {
  let response: Response;
  try {
    response = await fetcher(url);
  } catch (error) {
    return { failure: 'transient', detail: String(error) };
  }
  if (!response.ok) {
    return {
      failure: responseFailureKind(response.status),
      detail: `HTTP ${response.status}`,
    };
  }
  try {
    return { value: await response.json() };
  } catch (error) {
    return { failure: 'schema', detail: `JSON parse failed: ${String(error)}` };
  }
}

async function fetchText(
  fetcher: ContractFetch,
  url: string
): Promise<{
  readonly value?: string;
  readonly failure?: ContractFailureKind;
  readonly detail?: string;
}> {
  let response: Response;
  try {
    response = await fetcher(url);
  } catch (error) {
    return { failure: 'transient', detail: String(error) };
  }
  if (!response.ok) {
    return {
      failure: responseFailureKind(response.status),
      detail: `HTTP ${response.status}`,
    };
  }
  return { value: await response.text() };
}

function validateRankingItem(
  rankingKey: string,
  areaType: PublicDataAreaType,
  value: unknown,
  resource: string
): {
  readonly findings: readonly ContractFinding[];
  readonly latestYear?: string;
} {
  if (!isRecord(value) || !isRecord(value.item)) {
    return {
      findings: [
        finding(
          'schema',
          'ranking',
          rankingKey,
          resource,
          'item wrapper is invalid'
        ),
      ],
    };
  }
  const item = value.item;
  const findings: ContractFinding[] = [];
  if (item.rankingKey !== rankingKey) {
    findings.push(
      finding('schema', 'ranking', rankingKey, resource, 'rankingKey mismatch')
    );
  }
  if (item.areaType !== areaType) {
    findings.push(
      finding(
        'area-type',
        'ranking',
        rankingKey,
        resource,
        `expected ${areaType}, received ${String(item.areaType)}`
      )
    );
  }
  const latestYear =
    isRecord(item.latestYear) && typeof item.latestYear.yearCode === 'string'
      ? item.latestYear.yearCode.slice(0, 4)
      : undefined;
  if (!latestYear) {
    findings.push(
      finding('year', 'ranking', rankingKey, resource, 'latestYear is missing')
    );
  }
  return { findings, latestYear };
}

function validateRankingValues(
  rankingKey: string,
  areaType: PublicDataAreaType,
  latestYear: string | undefined,
  value: unknown,
  resource: string
): readonly ContractFinding[] {
  if (!isRecord(value) || !Array.isArray(value.partitions)) {
    return [
      finding(
        'schema',
        'ranking',
        rankingKey,
        resource,
        'values wrapper is invalid'
      ),
    ];
  }
  const findings: ContractFinding[] = [];
  if (value.rankingKey !== rankingKey) {
    findings.push(
      finding('schema', 'ranking', rankingKey, resource, 'rankingKey mismatch')
    );
  }
  if (value.areaType !== areaType) {
    findings.push(
      finding(
        'area-type',
        'ranking',
        rankingKey,
        resource,
        `expected ${areaType}, received ${String(value.areaType)}`
      )
    );
  }
  if (value.partitions.length === 0) {
    findings.push(
      finding('empty', 'ranking', rankingKey, resource, 'partitions are empty')
    );
    return findings;
  }

  let hasNonEmptyPartition = false;
  let hasLatestYear = latestYear === undefined;
  for (const partition of value.partitions) {
    if (!isRecord(partition) || !Array.isArray(partition.values)) {
      findings.push(
        finding(
          'schema',
          'ranking',
          rankingKey,
          resource,
          'partition is invalid'
        )
      );
      continue;
    }
    const normalizedYear =
      typeof partition.yearCode === 'string'
        ? partition.yearCode.slice(0, 4)
        : '';
    if (normalizedYear === latestYear) hasLatestYear = true;
    if (partition.values.length > 0) hasNonEmptyPartition = true;
    if (partition.count !== partition.values.length) {
      findings.push(
        finding(
          'schema',
          'ranking',
          rankingKey,
          resource,
          `partition ${normalizedYear} count mismatch`
        )
      );
    }
    for (const row of partition.values) {
      if (!isRecord(row) || typeof row.yearCode !== 'string') {
        findings.push(
          finding(
            'schema',
            'ranking',
            rankingKey,
            resource,
            'value row is invalid'
          )
        );
        break;
      }
      if (row.areaType !== undefined && row.areaType !== areaType) {
        findings.push(
          finding(
            'area-type',
            'ranking',
            rankingKey,
            resource,
            `row expected ${areaType}, received ${String(row.areaType)}`
          )
        );
        break;
      }
      if (row.yearCode.slice(0, 4) !== normalizedYear) {
        findings.push(
          finding('year', 'ranking', rankingKey, resource, 'row year mismatch')
        );
        break;
      }
    }
  }
  if (!hasNonEmptyPartition) {
    findings.push(
      finding(
        'empty',
        'ranking',
        rankingKey,
        resource,
        'all partitions are empty'
      )
    );
  }
  if (!hasLatestYear) {
    findings.push(
      finding(
        'year',
        'ranking',
        rankingKey,
        resource,
        `latest year ${latestYear} is absent`
      )
    );
  }
  return findings;
}

function extractBlogAssetPaths(markdown: string): readonly string[] {
  const paths = new Set<string>();
  for (const pattern of [MARKDOWN_ASSET_PATTERN, HTML_ASSET_PATTERN]) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(markdown)) !== null) {
      const candidate = match[1].trim().replace(/^<|>$/g, '');
      if (candidate.startsWith('data/')) paths.add(candidate);
    }
  }
  return [...paths].sort();
}

async function auditRanking(
  fetcher: ContractFetch,
  baseUrl: string,
  expectation: RankingContractExpectation
): Promise<RankingOutcome> {
  const encodedKey = encodeURIComponent(expectation.rankingKey);
  const itemResource = `app/ranking/${encodedKey}/item.json`;
  const valuesResource = `app/ranking/${encodedKey}/values.json`;
  const itemResult = await fetchJson(fetcher, `${baseUrl}/${itemResource}`);
  if (itemResult.failure) {
    return {
      findings: [
        finding(
          itemResult.failure,
          'ranking',
          expectation.rankingKey,
          itemResource,
          itemResult.detail ?? 'fetch failed'
        ),
      ],
      isUsable: false,
    };
  }
  const itemAudit = validateRankingItem(
    expectation.rankingKey,
    expectation.areaType,
    itemResult.value,
    itemResource
  );
  const valuesResult = await fetchJson(fetcher, `${baseUrl}/${valuesResource}`);
  if (valuesResult.failure) {
    return {
      findings: [
        ...itemAudit.findings,
        finding(
          valuesResult.failure,
          'ranking',
          expectation.rankingKey,
          valuesResource,
          valuesResult.detail ?? 'fetch failed'
        ),
      ],
      isUsable: false,
    };
  }
  const valuesFindings = validateRankingValues(
    expectation.rankingKey,
    expectation.areaType,
    itemAudit.latestYear,
    valuesResult.value,
    valuesResource
  );
  const findings = [...itemAudit.findings, ...valuesFindings];
  return { findings, isUsable: findings.length === 0 };
}

async function mapConcurrent<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>
): Promise<readonly R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  const worker = async (): Promise<void> => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(values[index]);
    }
  };
  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, concurrency), values.length) },
      worker
    )
  );
  return results;
}

export async function auditPublicDataContracts(
  input: PublicDataContractInput,
  options: {
    readonly baseUrl: string;
    readonly fetcher?: ContractFetch;
    readonly concurrency?: number;
  }
): Promise<ContractAuditResult> {
  const fetcher = options.fetcher ?? fetch;
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const rankingExpectations = new Map(
    input.rankings.map((expectation) => [expectation.rankingKey, expectation])
  );
  for (const theme of input.themes) {
    for (const rankingKey of theme.rankingKeys) {
      if (!rankingExpectations.has(rankingKey)) {
        rankingExpectations.set(rankingKey, {
          rankingKey,
          areaType: theme.areaType,
        });
      }
    }
  }

  const rankingOutcomes = await mapConcurrent(
    [...rankingExpectations.values()],
    options.concurrency ?? 16,
    (expectation) => auditRanking(fetcher, baseUrl, expectation)
  );
  const outcomesByKey = new Map(
    [...rankingExpectations.keys()].map((key, index) => [
      key,
      rankingOutcomes[index],
    ])
  );
  const findings: ContractFinding[] = rankingOutcomes.flatMap(
    (outcome) => outcome.findings
  );

  let themeReferenceCount = 0;
  for (const theme of input.themes) {
    for (const rankingKey of theme.rankingKeys) {
      themeReferenceCount += 1;
      const outcome = outcomesByKey.get(rankingKey);
      if (!outcome?.isUsable) {
        findings.push(
          finding(
            'missing',
            'theme',
            theme.themeKey,
            rankingKey,
            'referenced ranking contract is unusable; partial fallback is forbidden'
          )
        );
      }
    }
  }

  let blogAssetCount = 0;
  const blogFindings = await mapConcurrent(
    input.blogs,
    options.concurrency ?? 16,
    async (blog): Promise<readonly ContractFinding[]> => {
      const articleResource = `app/blog/${encodeURIComponent(blog.slug)}/article.md`;
      const articleResult = await fetchText(
        fetcher,
        `${baseUrl}/${articleResource}`
      );
      if (articleResult.failure) {
        return [
          finding(
            articleResult.failure,
            'blog',
            blog.slug,
            articleResource,
            articleResult.detail ?? 'fetch failed'
          ),
        ];
      }
      const assetPaths = extractBlogAssetPaths(articleResult.value ?? '');
      blogAssetCount += assetPaths.length;
      const assetFindings = await mapConcurrent(
        assetPaths,
        4,
        async (assetPath): Promise<ContractFinding | null> => {
          const resource = `app/blog/${encodeURIComponent(blog.slug)}/${assetPath}`;
          let response: Response;
          try {
            response = await fetcher(`${baseUrl}/${resource}`);
          } catch (error) {
            return finding(
              'transient',
              'blog',
              blog.slug,
              resource,
              String(error)
            );
          }
          if (response.ok) return null;
          return finding(
            responseFailureKind(response.status),
            'blog',
            blog.slug,
            resource,
            `HTTP ${response.status}`
          );
        }
      );
      return assetFindings.filter(
        (value): value is ContractFinding => value !== null
      );
    }
  );
  findings.push(...blogFindings.flat());

  return {
    findings,
    checked: {
      rankings: rankingExpectations.size,
      themeReferences: themeReferenceCount,
      blogs: input.blogs.length,
      blogAssets: blogAssetCount,
    },
  };
}
