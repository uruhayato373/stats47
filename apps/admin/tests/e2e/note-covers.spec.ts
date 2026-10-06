import { expect, test, type Page } from '@playwright/test';

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
  await expect(main.getByRole('status')).toContainText('286件中');
  await filter(page, () => page.getByRole('navigation', { name: 'カバーの分類' }).getByRole('button', { name: /県別家計/ }).click());
  await expect(main.getByRole('status')).toContainText('47件中');
  await filter(page, () => page.getByRole('combobox', { name: 'noteへの反映' }).selectOption('published'));
  await expect(main.getByRole('status')).toContainText('47件中');
  await main.getByLabel('1ページ', { exact: true }).selectOption('48');
  await expect(body.locator('tr')).toHaveCount(47);
  await expect(main.getByRole('button', { name: '次へ', exact: true })).toBeDisabled();
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
