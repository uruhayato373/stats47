import { expect, test } from '@playwright/test';
test('legacy asset entry opens the shared image workspace', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto('/assets');
  await expect(page).toHaveURL(/\/ops\/image-library/);
  await expect(
    page.getByRole('heading', { name: '画像ライブラリ', exact: true })
  ).toBeVisible();
  await expect(page.getByLabel('画像の用途')).toBeVisible();
  await expect(page.getByLabel('既存カタログ')).toBeVisible();
});
