import { expect, test } from '@playwright/test';

test.describe('/content/references 参考文献の活用・展開管理', () => {
  test('日本語の資料名と12展開先、企画・補強の全量サマリを表示する', async ({
    page,
  }) => {
    await page.goto('/content/references', { waitUntil: 'load' });

    await expect(
      page.getByRole('heading', { name: /参考文献の活用・展開管理/ })
    ).toBeVisible();
    await expect(page.getByText('日本国勢図会', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /展開先別の状況/ })
    ).toBeVisible();
    await expect(
      page.getByRole('row', { name: /テーマページ 12 18 0 3 28/ })
    ).toBeVisible();
    await expect(
      page.getByRole('row', { name: /YouTube動画 0 1 15 0 45/ })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /企画・下書き/ })
    ).toBeVisible();
    await expect(page.getByText('テーマ企画').first()).toBeVisible();
    await expect(page.getByText('ブログ下書き').first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /既存コンテンツの補強候補/ })
    ).toBeVisible();
    await expect(page.getByText('japan-zue', { exact: true })).toBeHidden();
  });

  test('日本語UIで展開先・状態・検索条件を絞り込める', async ({ page }) => {
    await page.goto('/content/references', { waitUntil: 'load' });

    const filters = page.locator('section').filter({
      has: page.getByRole('heading', { name: /検索・絞り込み/ }),
    });
    await filters.getByRole('link', { name: '制作中', exact: true }).click();
    await filters.getByLabel('展開先').selectOption('youtube');
    await filters
      .getByLabel('展開テーマを検索')
      .fill('日本語指導が必要な児童生徒数');
    await filters.getByRole('button', { name: '検索する' }).click();

    const portfolio = page.locator('section').filter({
      has: page.getByRole('heading', { name: /展開テーマ一覧/ }),
    });
    await expect(
      portfolio.getByText('日本語指導が必要な児童生徒数')
    ).toBeVisible();
    await expect(
      portfolio.getByText('YouTube動画', { exact: true }).first()
    ).toBeVisible();
    await expect(
      portfolio.getByText('制作中', { exact: true }).first()
    ).toBeVisible();
    await expect(portfolio.getByText(/8分/)).toBeVisible();
    await expect(page).toHaveURL(/channel=youtube/);
    await expect(page).toHaveURL(/stage=draft/);
  });

  test('補強候補を全件ページ送りできる', async ({ page }) => {
    await page.goto('/content/references', { waitUntil: 'load' });

    const context = page.locator('section').filter({
      has: page.getByRole('heading', { name: /既存コンテンツの補強候補/ }),
    });
    await expect(context.getByText('1 / 21ページ')).toBeVisible();
    await context.getByRole('link', { name: '次へ' }).click();
    await expect(page).toHaveURL(/contextPage=2/);
    await expect(context.getByText('2 / 21ページ')).toBeVisible();
  });
});
