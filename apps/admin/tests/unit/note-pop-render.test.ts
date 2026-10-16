import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { renderPopCover } from '../../../../.claude/scripts/note/lib/pop-cover-render';
import { buildCoverPlan, readCoverPolicies, seedCoverProduction } from '../../../../.claude/scripts/note/lib/cover-production.mjs';
import { emptyCoverArticle, type CoverLedger } from '../../../../.claude/scripts/note/lib/cover-assets.mjs';

function plan() {
  const article = { key: 'pinned-intro', title: '紹介', category: 'intro' };
  const ledger: CoverLedger = { schemaVersion: 1, account: 'stats47', updatedAt: new Date().toISOString(), articles: [emptyCoverArticle(article)] };
  const policies = readCoverPolicies(); seedCoverProduction(ledger, [article], policies);
  ledger.articles[0].production!.policyVersion = 1;
  ledger.articles[0].production!.brief = { headline: '地域の違いを\n知る', subline: '公的統計から読み解く', subject: '案内役', evidence: '自己紹介記事' };
  return buildCoverPlan(ledger.articles[0], article, policies)!;
}
describe('POPカバーの組版', () => {
  it('保存したコピーを固定描画し、寸法と文字配置の根拠を残す', async () => {
    const background = await sharp({ create: { width: 1280, height: 670, channels: 3, background: '#f0f8ff' } }).png().toBuffer();
    const result = await renderPopCover(plan(), background);
    expect(await sharp(result.png).metadata()).toMatchObject({ width: 1280, height: 670, format: 'png' });
    expect(result.evidence.layout.length).toBeGreaterThan(0);
    expect(result.evidence.production.composition.headline).toBe('地域の違いを\n知る');
    expect(result.evidence.backgroundSha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it('収まらない見出しを黙って縮小・切り落とさない', async () => {
    const request = plan(); request.composition.headline = '1\n2\n3\n4';
    await expect(renderPopCover(request, Buffer.alloc(0))).rejects.toThrow('3行以内');
  });
});
