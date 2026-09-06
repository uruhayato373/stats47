import { describe, expect, it } from 'vitest';
import { reproductionInstructions, sourceHistoryNotice } from '../src/channels/geo/cli';

describe('Geo product reproduction instructions', () => {
  it('does not label a dirty checkout as a verified public revision', () => {
    const body = reproductionInstructions('population-land-price', 'land-pack', 'abc123', true);
    expect(body).toContain('HEADだけでは今回の結果を再現できません');
    expect(body).toContain('uncommitted code: true');
    expect(body).not.toContain('verified revision');
    expect(body).toContain('--land-price-only');
    expect(body).toContain('pointMeshIds');
    expect(body).toContain('--article-key land-pack');
    const history = sourceHistoryNotice('2026-09-05T11:06:40.000Z');
    expect(history).toContain('初回原典取得日時は旧パイプラインで未記録');
    expect(history).toContain('verificationAt）は 2026-09-05T11:06:40.000Z');
    expect(history).toContain('原典取得日時や旧入力の変換日時ではありません');
  });

  it('keeps flood river classes distinct from the hazard scale and river grades', () => {
    const body = reproductionInstructions('population-flood-risk', 'flood-pack', 'abc123', false);
    expect(body).toContain('河川区分10の107ファイル、区分20の94ファイル');
    expect(body).toContain('ZIP内部の想定最大規模20');
    expect(body).not.toMatch(/一級河川|二級河川|verified revision/);
    expect(body).toContain('公開リポジトリからこのcommitを取得できること');
  });

  it('does not advertise spatial reproduction for a baseline ranking', () => {
    expect(reproductionInstructions('2050-population', 'baseline', 'abc123', false)).toBe('');
  });
});
