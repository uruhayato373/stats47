import { expect, test, type Page } from '@playwright/test';
import { NOTE_ARTICLES } from '../../../../.claude/scripts/note/catalog';
import { readCoverLedger } from '../../../../.claude/scripts/note/lib/cover-assets.mjs';
import { coverProductionView, readCoverPolicies } from '../../../../.claude/scripts/note/lib/cover-production.mjs';
import type { NoteCoverRow } from '../../lib/server/note-covers';

async function filter(page: Page, action: () => Promise<unknown>) {
  const button = page.getByRole('button', { name: '分類・絞り込み', exact: true });
  const mobile = await button.isVisible();
  if (mobile) await button.click();
  await action();
  if (mobile) await page.keyboard.press('Escape');
}

test.beforeEach(async ({ page }) => {
  // Exercise navigation independently of private-storage credentials in CI.
  await page.route('**/note-cover/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="670"><rect width="1280" height="670" fill="#142754"/></svg>' }));
});

test('分類・検索・並べ替え・ページ送りが同じURL条件を保持する', async ({ page }) => {
  await page.goto('/content/note/covers?category=household&view=complete');
  const main = page.locator('main');
  const body = main.locator('tbody');
  await expect(body.locator('tr')).toHaveCount(12);
  await expect(main.getByRole('status')).toContainText('47件中');
  await main.getByRole('button', { name: '次へ', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await main.getByRole('columnheader', { name: '記事' }).getByRole('button').click();
  await expect(main.getByRole('columnheader', { name: '記事' })).toHaveAttribute('aria-sort', 'descending');
  const titles = await body.locator('td:first-child button').allTextContents();
  expect(titles).toEqual([...titles].sort((a, b) => b.localeCompare(a, 'ja')));
  await expect(page).not.toHaveURL(/page=2/);
  await main.getByRole('textbox', { name: '記事を検索' }).fill('Ａ－ＫＡＫＥＩ－ＡＩＣＨＩ');
  await expect(body.locator('tr')).toHaveCount(1);
  await expect(body).toContainText('a-kakei-aichi');
  await page.reload();
  await expect(body).toContainText('a-kakei-aichi');
  await filter(page, () => page.getByRole('combobox', { name: '確認状態', exact: true }).selectOption('needs-revision'));
  await expect(main.getByRole('status')).toContainText('0件');
  await filter(page, () => page.getByRole('button', { name: '絞り込みを解除' }).click());
  await expect(main.getByRole('status')).toContainText(`${NOTE_ARTICLES.filter(a => a.status === 'published').length}件中`);
  await filter(page, () => page.getByRole('navigation', { name: 'カバーの分類' }).getByRole('button', { name: /県別家計/ }).click());
  await expect(main.getByRole('status')).toContainText('47件中');
  await filter(page, () => page.getByRole('combobox', { name: 'noteへの反映' }).selectOption('published'));
  await expect(main.getByRole('status')).toContainText('47件中');
  await main.getByLabel('1ページ', { exact: true }).selectOption('48');
  await expect(body.locator('tr')).toHaveCount(47);
  await expect(main.getByRole('button', { name: '次へ', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('制作IDで探し、内容の保存と制作仕様の受け渡しができる', async ({ page }) => {
  const article = NOTE_ARTICLES.find(a => a.key === 'a-kakei-aichi')!;
  const record = readCoverLedger().articles.find(r => r.articleKey === article.key)!;
  const source: NoteCoverRow = { key: article.key, title: article.title, noteUrl: article.noteUrl!, category: 'household', articleStatus: 'published',
    production: coverProductionView(record, { ...article, category: 'household' }, readCoverPolicies()), review: 'pending', reviewReason: null,
    currentImageUrl: null, candidateImageUrl: null, candidateVersion: null, coverObservedAt: null, publication: 'unapproved', stale: false, missingVersions: [], archivedVersions: [] };
  let savedBody: { action: string; brief: { headline: string; subject: string; evidence: string } } | undefined;
  await page.route('**/api/note-covers/*/production', async route => {
    savedBody = route.request().postDataJSON();
    const row = structuredClone(source);
    row.production = { ...row.production, revision: 'f'.repeat(64), stage: 'ready', brief: { subline: '', ...savedBody!.brief }, plan: {
      schemaVersion: 1, renderer: 'note-imagegen-cover-v1', account: 'stats47', productionId: row.production.id!, articleKey: row.key, articleTitle: row.title, noteUrl: row.noteUrl,
      policyId: row.production.policy.id, policyVersion: row.production.policy.version, policySnapshot: row.production.policy, imagePrompt: '文字込みの制作プロンプト',
      composition: { width: 1280, height: 670, headline: savedBody!.brief.headline, subline: '', accent: '#b25614', publisher: 'stats47' },
      evidence: savedBody!.brief.evidence, instructions: 'fixture', planSha256: 'a'.repeat(64),
    } };
    await route.fulfill({ json: { row } });
  });
  await page.goto(`/content/note/covers?category=household&q=${source.production.id}`);
  await expect(page.getByText('このカテゴリの制作方針', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /のカバーを比較/ }).click();
  const dialog = page.getByRole('dialog', { name: 'カバーを比較' });
  await dialog.getByLabel('大きく見せるコピー').fill('家計から見る愛知');
  // 家計の記事は対象都市と対象年が無いと保存できない (scopeReady)
  await dialog.getByLabel('家計データの対象都市').fill('名古屋市');
  await dialog.getByLabel('対象年', { exact: true }).fill('2024');
  await dialog.getByLabel('描く題材・構図').fill('喫茶店のカップを右側に大きく');
  await dialog.getByLabel('コピーの根拠・本文の該当箇所').fill('本文の家計データと比較条件');
  await dialog.getByRole('button', { name: '制作内容を保存', exact: true }).click();
  await expect(dialog.getByText('画像制作待ち', { exact: true })).toBeVisible();
  expect(savedBody?.action).toBe('brief');
  const downloaded = page.waitForEvent('download');
  await dialog.getByRole('button', { name: '制作仕様をダウンロード' }).click();
  expect((await downloaded).suggestedFilename()).toBe(`${source.production.id}-request.json`);
  await expect(dialog.getByLabel('生成プロンプト（文字込み）')).toHaveValue('文字込みの制作プロンプト');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('表からカバーを大きく比較し、ギャラリーへ条件を引き継げる', async ({ page }) => {
  await page.goto('/content/note/covers?category=household&q=aichi');
  await page.getByRole('button', { name: /のカバーを比較/ }).click();
  const dialog = page.getByRole('dialog', { name: 'カバーを比較' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img', { name: /公開カバー/ })).toBeVisible();
  await expect(dialog.getByRole('img', { name: /差し替え候補/ })).toBeVisible();
  await dialog.getByText('過去の保管版 2 件', { exact: true }).click();
  await expect(dialog.getByRole('img', { name: /過去の保管版/ })).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await page.getByRole('tab', { name: 'カバー比較' }).click();
  await expect(page).toHaveURL(/view=gallery/);
  await expect(page.getByRole('button', { name: '大きく比較' })).toHaveCount(1);
  await expect(page.getByRole('textbox', { name: '記事を検索' })).toHaveValue('aichi');
  await page.reload();
  await expect(page.getByRole('tab', { name: 'カバー比較' })).toHaveAttribute('aria-selected', 'true');
});

test('選んだ記事だけの修正前後を比較し、同じ集合を順に確認できる', async ({ page }) => {
  const ids = ['NCI-00215', 'NCI-00118'];
  await page.goto(`/content/note/covers?view=gallery&ids=${ids.join(',')}`);
  await expect(page.getByRole('heading', { name: '今回の修正対象' })).toBeVisible();
  await expect(page.getByRole('button', { name: '大きく比較', exact: true })).toHaveCount(2);
  await expect(page.getByText('修正後の候補', { exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: '大きく比較', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'カバーを比較' });
  await expect(dialog.getByLabel('生成プロンプト（文字込み）')).toBeVisible();
  await dialog.getByRole('button', { name: '次の記事を確認', exact: true }).click();
  await expect(dialog.getByRole('button', { name: '次の記事を確認', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByRole('button', { name: '大きく比較', exact: true })).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
