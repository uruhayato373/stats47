import { expect, test } from '@playwright/test';
import { CORRELATION_DIRECTIONS, CORRELATION_SELECTION_POLICY } from '@stats47/correlation';

test('相関一覧は正負各10件を保ち、本文幅で横並びと縦並びを切り替える', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/ranking/annual-sunshine-duration', { waitUntil: 'load' });
  const navigation = page.locator('[data-nav-surface="ranking_correlation"]');
  await expect(navigation).toBeVisible({ timeout: 30_000 });
  await expect(navigation.locator('a[href^="/blog/"]')).toHaveCount(0);
  for (const direction of CORRELATION_DIRECTIONS) {
    const table = navigation.getByRole('table', { name: CORRELATION_SELECTION_POLICY.groups[direction].label });
    await expect(table.locator('tbody tr')).toHaveCount(CORRELATION_SELECTION_POLICY.groups[direction].limit);
    await expect(table.getByRole('columnheader')).toHaveCount(2);
    const values = await table.locator('tbody td').allTextContents();
    expect(values.every(value => direction === 'positive' ? value.startsWith('+') : value.startsWith('-'))).toBe(true);
  }
  const initial = await navigation.getByRole('link').allTextContents();
  for (const width of [375, 390, ...[640, 768, 1024, 1280, 1536].flatMap(value => [value - 1, value, value + 1]), 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    const layout = await navigation.evaluate(el => {
      const sections = [...el.querySelectorAll('section')].map(section => section.getBoundingClientRect());
      return { width: el.getBoundingClientRect().width, first: { x: sections[0].x, y: sections[0].y, right: sections[0].right }, second: { x: sections[1].x, y: sections[1].y }, overflow: el.scrollWidth - el.clientWidth };
    });
    if (layout.width >= 768) {
      expect(layout.first.y).toBe(layout.second.y);
      expect(layout.second.x).toBeGreaterThan(layout.first.right);
    } else {
      expect(layout.first.x).toBe(layout.second.x);
      expect(layout.second.y).toBeGreaterThan(layout.first.y);
    }
    expect(layout.overflow).toBeLessThanOrEqual(1);
    expect(await navigation.getByRole('link').allTextContents()).toEqual(initial);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});
