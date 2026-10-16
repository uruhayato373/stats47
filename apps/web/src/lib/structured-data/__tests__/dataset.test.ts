import { describe, expect, it } from 'vitest';

import { invalidDatasetDescriptions } from '../dataset';

describe('recursive Dataset descriptions', () => {
  it('detects missing and short descriptions in @graph, isBasedOn and hasPart', () => {
    const value = { '@graph': [{ '@type': 'Dataset', description: '統'.repeat(50),
      isBasedOn: { '@type': ['CreativeWork', 'Dataset'], description: '短い説明' },
      hasPart: [{ '@type': 'Dataset' }],
    }] };
    expect(invalidDatasetDescriptions(value)).toEqual([
      '$.@graph[0].isBasedOn.description: 4 characters (expected 50–5000)',
      '$.@graph[0].hasPart[0].description: 0 characters (expected 50–5000)',
    ]);
  });
  it('accepts both boundaries and rejects oversized descriptions', () => {
    expect(invalidDatasetDescriptions([50, 5000].map((n) => ({ '@type': 'Dataset', description: '統'.repeat(n) })))).toEqual([]);
    expect(invalidDatasetDescriptions({ '@type': 'Dataset', description: '統'.repeat(5001) })).toHaveLength(1);
  });
});
