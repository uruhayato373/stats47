import { expect, test, type Page } from '@playwright/test';

// Browser tests use fixture responses; persistence and guards use the real store in unit tests.
const pixel =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" fill="#e8eff5"/><text x="80" y="170" font-size="64">SNS preview</text></svg>'
  );
async function fixture(page: Page) {
  const posts = Array.from({ length: 30 }, (_, i) => ({
    id: 1100 + i,
    platform: 'x',
    status: i === 29 ? 'draft' : 'scheduled',
    domain: ['household-receipt', 'area-atlas', 'rank-routes'][i % 3],
    content_key: `sample-${i}`,
    caption: `サンプル本文 ${i}`,
    scheduled_at: i === 29 ? null : '2026-10-12T03:10:00Z',
    approval: { state: 'approved' },
    revision: 'a'.repeat(64),
    media_candidates: [{ url: pixel, source: 'fixture' }],
  }));
  await page.route('**/api/inventory', (r) =>
    r.fulfill({ json: { posts, extras: [] } })
  );
  await page.route('**/api/limits', (r) => r.fulfill({ json: { limits: {} } }));
  await page.route('**/api/ig-consistency', (r) =>
    r.fulfill({ json: { onlyInJson: [], onlyInPosts: [] } })
  );
  return posts;
}

test.describe('/sns 投稿ID台帳', () => {
  test('画像と型・ページ送り・ID検索・台帳切替・再読込後の条件維持', async ({
    page,
  }) => {
    await fixture(page);
    await page.goto('/sns');
    await expect(page.getByTestId('sns-count')).toHaveText('30 件');
    await expect(
      page.getByRole('link', { name: '#1129', exact: true })
    ).toBeVisible();
    await page.getByRole('button', { name: '次へ', exact: true }).click();
    await expect(page.getByText('2 / 2 ページ', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('link', { name: '#1100', exact: true })
    ).toBeVisible();
    await page.getByRole('textbox', { name: '投稿を検索' }).fill('#1109');
    await expect(page.getByTestId('sns-count')).toHaveText('1 件');
    await expect(
      page.getByRole('link', { name: '#1109', exact: true })
    ).toBeVisible();
    await page.getByRole('button', { name: '台帳表示', exact: true }).click();
    await expect(
      page.getByRole('columnheader', { name: 'ID / 画像' })
    ).toBeVisible();
    await page.reload();
    await expect(page.getByRole('textbox', { name: '投稿を検索' })).toHaveValue(
      '#1109'
    );
    await expect(
      page.getByRole('button', { name: '台帳表示', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: '絞り込みを解除' }).click();
    await page
      .getByRole('combobox', { name: '画像の型' })
      .selectOption('area-atlas');
    await expect(page.getByTestId('sns-count')).toHaveText('10 件');
    await page
      .getByRole('combobox', { name: '媒体', exact: true })
      .selectOption('instagram');
    await expect(
      page.getByText('該当する投稿がありません。検索条件を変更してください。')
    ).toBeVisible();
  });

  test('画像を確認しながら下書き編集。失敗時も本文を保持、保存成功を一覧へ反映', async ({
    page,
  }) => {
    const posts = await fixture(page);
    let attempts = 0;
    await page.route('**/api/posts/1129/caption', async (r) => {
      const body = r.request().postDataJSON();
      expect(r.request().method()).toBe('PATCH');
      expect(body.revision).toBe('a'.repeat(64));
      expect(body.caption).toBe('編集した本文\n2行目');
      if (attempts++ === 0)
        return r.fulfill({
          status: 409,
          json: { error: '別の操作で更新されています。' },
        });
      posts[29] = {
        ...posts[29],
        caption: body.caption,
        approval: { state: 'pending' },
        revision: 'b'.repeat(64),
      };
      return r.fulfill({ json: { post: posts[29] } });
    });
    await page.goto('/sns?status=draft');
    await page
      .getByRole('button', {
        name: '投稿 #1129 の画像と本文を開く',
        exact: true,
      })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('img')).toBeVisible();
    await page
      .getByLabel('下書き本文', { exact: true })
      .fill('編集した本文\n2行目');
    await page
      .getByRole('button', { name: '下書きを保存', exact: true })
      .click();
    await expect(dialog.getByRole('alert')).toHaveText(
      '別の操作で更新されています。'
    );
    await expect(page.getByLabel('下書き本文', { exact: true })).toHaveValue(
      '編集した本文\n2行目'
    );
    await page
      .getByRole('button', { name: '下書きを保存', exact: true })
      .click();
    await expect(dialog.getByRole('status')).toContainText(
      '下書きを保存しました'
    );
    await expect(
      page.getByRole('button', { name: '下書きを保存', exact: true })
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(
      page.getByText('編集した本文 2行目', { exact: true })
    ).toBeVisible();
    await expect(page.getByText('承認待ち', { exact: true })).toBeVisible();
  });

  test('予約済みは本文を閲覧、JSTを表示し編集・投稿ボタンを出さない', async ({
    page,
  }) => {
    await fixture(page);
    await page.goto('/sns?q=1109');
    await page
      .getByRole('button', {
        name: '投稿 #1109 の画像と本文を開く',
        exact: true,
      })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByText('予約日時: 2026/10/12 12:10 JST')
    ).toBeVisible();
    await expect(dialog.locator('textarea')).toHaveCount(0);
    await expect(
      page.getByRole('button', {
        name: /下書きを保存|予約投稿|即時投稿|dry-run/,
      })
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });
});

test('展開候補は予約前だけを表示し、出どころと準備状況を保持する', async ({ page }) => {
  await fixture(page);
  await page.route('**/api/inventory', r => r.fulfill({ json: { posts: [
    { id: 1200, platform: 'x', status: 'draft', domain: 'area-atlas', caption: '本文', planning: { origin: 'new-format', batch: '2026-10-11', title: '沖縄県図鑑', preview_only: false, note: '対象年を確認' }, media_candidates: [{url:pixel, source:'local'}] },
    { id: 1201, platform: 'instagram', status: 'draft', domain: 'ranking', caption: '', planning: { origin: 'material-import', batch: '2026-10-11', title: '確認用の素材', preview_only: true, note: '表紙だけ' }, media_candidates: [{url:pixel, source:'local'}] },
    { id: 1202, platform: 'x', status: 'scheduled', scheduled_at: '2026-10-12', domain: 'area-atlas' },
  ], extras: [] } }));
  await page.goto('/sns?scope=candidates');
  await expect(page.getByTestId('sns-count')).toHaveText('2 件');
  await expect(page.getByRole('link', {name:'#1202',exact:true})).toHaveCount(0);
  await page.getByRole('combobox', {name:'候補の出どころ'}).selectOption('new-format');
  await expect(page.getByTestId('sns-count')).toHaveText('1 件');
  await expect(page.getByRole('heading', {name:'沖縄県図鑑'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('combobox', {name:'候補の出どころ'})).toHaveValue('new-format');
  await page.getByRole('combobox', {name:'候補の出どころ'}).selectOption('');
  await page.getByRole('combobox', {name:'準備状況'}).selectOption('preview');
  await expect(page.getByTestId('sns-count')).toHaveText('1 件');
  await expect(page.getByRole('heading', {name:'確認用の素材'})).toBeVisible();
});
