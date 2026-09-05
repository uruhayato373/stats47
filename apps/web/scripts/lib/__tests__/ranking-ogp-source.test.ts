import { describe, expect, it } from 'vitest';

import { resolveRankingOgpSource } from '../ranking-ogp-source';

describe('ranking OGP source attribution', () => {
  it.each(['国土交通省', '水産庁'])('uses current official source %s rather than e-Stat or old KSJ metadata', (name) => {
    expect(resolveRankingOgpSource({ sourceConfig: { source: { name } }, source: { name: '国土数値情報' } })).toBe(name);
  });
  it('retains legacy source field support', () => {
    expect(resolveRankingOgpSource({ source: { source: { name: 'Legacy nested' } } })).toBe('Legacy nested');
    expect(resolveRankingOgpSource({ source: { name: 'Legacy direct' } })).toBe('Legacy direct');
    expect(resolveRankingOgpSource({})).toBe('e-Stat');
  });
});
