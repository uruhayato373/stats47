import { expect, test } from '@playwright/test';
test('legacy SVG entry preserves its filter in the shared workspace', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto('/svg');
  await expect(page).toHaveURL(/\/ops\/image-library\?format=svg/);
  await expect(page.getByLabel('画像形式')).toHaveValue('svg');
  await expect(page.getByLabel('図の型')).toBeVisible();
  await expect(
    page.getByRole('link', { name: '図の型・媒体別方針', exact: true })
  ).toBeVisible();
});
