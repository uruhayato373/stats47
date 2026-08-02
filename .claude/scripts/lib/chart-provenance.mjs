/**
 * chart source.json の構造的な再取得可能性を判定する純粋関数。
 *
 * ネットワーク上の参照先が実在するかは audit-chart-provenance.mjs が確認する。
 * kind 語彙と必須フィールドはここを唯一の真実源とし、公開前gateと定期監査で共有する。
 */

export function splitChartSourceKeys(value) {
  if (Array.isArray(value)) return value.flatMap(splitChartSourceKeys);
  if (typeof value !== 'string') return [];
  return value
    .split(/[+|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitStatsDataIds(value) {
  if (Array.isArray(value)) return value.flatMap(splitStatsDataIds);
  if (typeof value !== 'string') return [];
  return value
    .split(/[/+|,]/)
    .map((item) => item.trim())
    .filter((item) => /^\d{10,}$/.test(item));
}

function nestedReferenceValues(source, field) {
  return [
    source,
    ...(Array.isArray(source.inputs) ? source.inputs : []),
    ...(Array.isArray(source.sources) ? source.sources : []),
    ...(Array.isArray(source.derivedFrom) ? source.derivedFrom : []),
  ]
    .filter((item) => item && typeof item === 'object')
    .flatMap((item) => splitChartSourceKeys(item[field]));
}

function rankingKeysFromR2Paths(source) {
  const matches = JSON.stringify(source).matchAll(
    /(?:r2:)?app\/ranking\/([^/"\s{}]+)\/values\.json/g
  );
  return [...matches].map((match) => match[1]);
}

function directRankingKeys(value) {
  return splitChartSourceKeys(value).filter(
    (item) => !item.includes('/') && !item.includes(':')
  );
}

function referencedRankingKeys(source) {
  return [
    ...directRankingKeys(source.rankingKey),
    ...directRankingKeys(source.rankingKeys),
    ...directRankingKeys(source.xKey),
    ...directRankingKeys(source.yKey),
    ...directRankingKeys(source.xRankingKey),
    ...directRankingKeys(source.yRankingKey),
    ...nestedReferenceValues(source, 'rankingKey'),
    ...(Array.isArray(source.derivedFrom)
      ? source.derivedFrom.flatMap((item) =>
          typeof item === 'string' ? directRankingKeys(item) : []
        )
      : []),
    ...rankingKeysFromR2Paths(source),
  ];
}

function hasNestedReference(source) {
  return (
    referencedRankingKeys(source).length > 0 ||
    nestedReferenceValues(source, 'statsDataId').length > 0 ||
    nestedReferenceValues(source, 'url').length > 0
  );
}

export function extractChartSourceReferences(sourceData) {
  if (!sourceData || typeof sourceData !== 'object' || Array.isArray(sourceData)) {
    return { rankingKeys: [], statsDataIds: [] };
  }
  const statsDataIds = [
    ...splitStatsDataIds(sourceData.statsDataId),
    ...[
      ...(Array.isArray(sourceData.inputs) ? sourceData.inputs : []),
      ...(Array.isArray(sourceData.sources) ? sourceData.sources : []),
      ...(Array.isArray(sourceData.derivedFrom) ? sourceData.derivedFrom : []),
    ].flatMap((item) =>
      item && typeof item === 'object'
        ? splitStatsDataIds(item.statsDataId)
        : []
    ),
  ];
  return {
    rankingKeys: [...new Set(referencedRankingKeys(sourceData))],
    statsDataIds: [...new Set(statsDataIds)],
  };
}

export const CHART_SOURCE_KIND_SPECS = {
  ranking: {
    hasReference: (source) => Boolean(source.rankingKey),
    rankingKeys: (source) => splitChartSourceKeys(source.rankingKey),
  },
  estat: {
    hasReference: (source) => Boolean(source.statsDataId),
    rankingKeys: () => [],
  },
  scatter: {
    hasReference: (source) =>
      Boolean(source.xKey && source.yKey) ||
      referencedRankingKeys(source).length >= 2,
    rankingKeys: referencedRankingKeys,
  },
  derived: {
    hasReference: (source) =>
      Boolean(source.source || source.xSource || source.ySource) ||
      hasNestedReference(source),
    rankingKeys: referencedRankingKeys,
  },
  manual: {
    hasReference: (source) => Boolean(source.source || source.url),
    rankingKeys: () => [],
  },
  correlation: {
    hasReference: (source) => Boolean(source.source),
    rankingKeys: () => [],
  },
  calculated: {
    hasReference: (source) =>
      Array.isArray(source.inputs) && source.inputs.length > 0,
    rankingKeys: referencedRankingKeys,
  },
  composite: {
    hasReference: (source) =>
      Boolean(source.xMetric?.rankingKey && source.yMetric?.rankingKey),
    rankingKeys: (source) => [
      ...splitChartSourceKeys(source.xMetric?.rankingKey),
      ...splitChartSourceKeys(source.yMetric?.rankingKey),
    ],
  },
  'ranking-pair': {
    hasReference: (source) => Boolean(source.source),
    rankingKeys: () => [],
  },
  'ranking-join': {
    hasReference: (source) => Boolean(source.xRankingKey && source.yRankingKey),
    rankingKeys: referencedRankingKeys,
  },
  'derived-scatter': {
    hasReference: (source) =>
      Array.isArray(source.rankingKeys) && source.rankingKeys.length > 0,
    rankingKeys: referencedRankingKeys,
  },
  authored: {
    hasReference: () => true,
    rankingKeys: () => [],
    isOutOfScope: true,
  },
  bar: {
    hasReference: (source) => !source.incomplete,
    rankingKeys: () => [],
  },
  line: {
    hasReference: (source) => !source.incomplete,
    rankingKeys: () => [],
  },
};

/**
 * @param {unknown} sourceData
 * @returns {{
 *   verdict: "valid"|"out-of-scope"|"invalid",
 *   code: string|null,
 *   detail: string,
 *   kind: string|null,
 *   rankingKeys: string[]
 * }}
 */
export function inspectChartSourceManifest(sourceData) {
  if (
    !sourceData ||
    typeof sourceData !== 'object' ||
    Array.isArray(sourceData)
  ) {
    return {
      verdict: 'invalid',
      code: 'invalid-source-json',
      detail: 'source.json をオブジェクトとして解析できない',
      kind: null,
      rankingKeys: [],
    };
  }

  const kind =
    typeof sourceData.kind === 'string' && sourceData.kind.trim()
      ? sourceData.kind.trim()
      : null;
  if (!kind) {
    return {
      verdict: 'invalid',
      code: 'no-kind',
      detail: 'kind フィールドが無い',
      kind: null,
      rankingKeys: [],
    };
  }

  const spec = CHART_SOURCE_KIND_SPECS[kind];
  if (!spec) {
    return {
      verdict: 'invalid',
      code: 'unknown-kind',
      detail: '未知の kind — chart-provenance.mjs の定義を更新すること',
      kind,
      rankingKeys: [],
    };
  }
  if (spec.isOutOfScope) {
    return {
      verdict: 'out-of-scope',
      code: null,
      detail: 'SSOT 指標ではない（data json 自体が真実源）',
      kind,
      rankingKeys: [],
    };
  }
  if (sourceData.incomplete === true) {
    return {
      verdict: 'invalid',
      code: 'self-declared-incomplete',
      detail: String(sourceData.note ?? 'incomplete: true'),
      kind,
      rankingKeys: [],
    };
  }
  if (!spec.hasReference(sourceData)) {
    return {
      verdict: 'invalid',
      code: 'missing-reference',
      detail: '再取得に必要な参照または計算式が無い',
      kind,
      rankingKeys: [],
    };
  }
  return {
    verdict: 'valid',
    code: null,
    detail: '構造上の再取得条件を満たす',
    kind,
    rankingKeys: [...new Set(spec.rankingKeys(sourceData))],
  };
}
