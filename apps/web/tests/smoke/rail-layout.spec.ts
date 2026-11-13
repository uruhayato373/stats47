import { expect, test, type Page } from './fixtures';

// 共通 Shell の全 rightRail 呼び出し元と、レールなし・ページ内ナビの代表。
// URL ごとの寸法補正・許容リストは持たない。同じ検査を全ページへ適用する。
const PAGES = [
  { path: '/ranking/total-population', rail: true },
  { path: '/ranking/annual-sunshine-duration', rail: true },
  { path: '/blog/prefecture-salary-gap-career', rail: true },
  { path: '/', rail: true },
  { path: '/ranking', rail: true },
  { path: '/category/population', rail: true },
  { path: '/blog', rail: true },
  { path: '/municipalities', rail: true },
  { path: '/geo/layers', rail: true },
  { path: '/geo/datasets/L01', rail: true },
  { path: '/survey/kakei-chousa', rail: false },
  { path: '/themes/population-dynamics', rail: false },
  { path: '/areas/01000', rail: false },
];

// CSS の設計契約を独立して検証する。viewport と shell の境界は別に走査する。
const VIEWPORT_BREAKPOINTS = [640, 768, 1024, 1280, 1536, 1700];
const SHELL_BREAKPOINTS = [640, 988];
const SIDEBAR_BREAKPOINT = 1024;
const RAIL_BREAKPOINT = 988;
const RAIL_WIDTH = 316;
const around = (width: number) => [width - 1, width, width + 1];

async function assertLayout(page: Page, hasRail: boolean) {
  const layout = await page.evaluate(() => {
    const main = document.querySelector('main [data-slot="shell-main"]')?.parentElement;
    const shell = main?.closest('[class*="@container/shell"]');
    const rail = shell?.querySelector('[data-slot="shell-rail"]');
    if (!main || !shell) throw new Error('共通 Shell の本文列が見つからない');
    const visible = (el: Element) => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
    const box = (el: Element) => {
      const { x, y, width, right } = el.getBoundingClientRect();
      return { x, y, width, right };
    };
    const style = rail ? getComputedStyle(rail) : null;
    const columns = style?.display === 'grid' ? style.gridTemplateColumns.split(' ').length : 1;
    return {
      shell: box(shell), main: box(main), rail: rail ? box(rail) : null,
      article: !!shell.closest('.reading-zone'), columns, gap: parseFloat(style?.columnGap ?? '') || 0,
      cards: rail ? [...rail.querySelectorAll('[data-slot="card"]')]
        .filter(el => visible(el) && !el.parentElement?.closest('[data-slot="card"]'))
        .map(el => ({ ...box(el), title: el.querySelector('h2,h3')?.textContent })) : [],
      ads: rail ? [...rail.querySelectorAll('img[width][height]')]
        .filter(el => visible(el) && Number(el.getAttribute('width')) > 1)
        .map(el => ({ width: el.getBoundingClientRect().width, original: Number(el.getAttribute('width')) })) : [],
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(layout.overflow, 'ページが横にはみ出す').toBeLessThanOrEqual(1);
  expect(!!layout.rail).toBe(hasRail);
  if (!layout.rail) return;
  const beside = layout.shell.width >= RAIL_BREAKPOINT;
  if (beside) {
    expect(layout.rail.width).toBeCloseTo(RAIL_WIDTH, 0);
    expect(layout.rail.x - layout.main.right).toBeCloseTo(16, 0);
  } else {
    expect(layout.main.width).toBeCloseTo(layout.shell.width, 0);
    expect(layout.rail.width).toBeCloseTo(layout.shell.width, 0);
  }
  expect(layout.columns).toBe(layout.article && !beside && layout.shell.width >= 640 ? 2 : 1);
  const columnWidth = (layout.rail.width - layout.gap * (layout.columns - 1)) / layout.columns;
  for (const card of layout.cards) {
    expect(Math.abs(card.width - columnWidth), `${card.title}: カード ${card.width}px / 列 ${columnWidth}px`).toBeLessThanOrEqual(1);
    expect(card.right).toBeLessThanOrEqual(layout.rail.right + 1);
  }
  for (const ad of layout.ads) {
    expect(ad.width).toBeCloseTo(Math.min(ad.original, columnWidth), 0);
  }
  if (page.url().includes('/geo/')) {
    // 本文上の開閉ナビと右レールは常に片方だけ。画面幅と本文幅の取り違えを検出する。
    await expect(page.getByRole('heading', { name: /^GIS一覧/ })).toHaveCount(1);
    expect(layout.cards.length).toBe(beside ? 1 : 0);
  } else {
    expect(layout.cards.length, 'レール内のカードが消えていない').toBeGreaterThan(0);
  }
}

for (const target of PAGES) {
  test(`共通レールの全境界と左メニュー開閉 ${target.path}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(target.path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.locator('[data-slot="sidebar"][data-state]')).toBeAttached();
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    await assertLayout(page, target.rail);
    let checks = 1;
    for (const state of ['expanded', 'collapsed']) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const sidebar = page.locator('[data-slot="sidebar"][data-state]');
      await expect(sidebar).toBeAttached();
      if (await sidebar.getAttribute('data-state') !== state) {
        await page.locator('[data-slot="sidebar-trigger"]').click();
        await expect(sidebar).toHaveAttribute('data-state', state);
      }
      // max-width に達していない状態で左右の余白とメニュー幅を実測し、shell の境界へ換算する。
      const inset = await page.evaluate(() => innerWidth - document.querySelector('main [class*="@container/shell"]')!.getBoundingClientRect().width);
      const widths = [...new Set([375, 390, 1920, ...VIEWPORT_BREAKPOINTS.flatMap(around), ...SHELL_BREAKPOINTS.flatMap(boundary => around(boundary + inset))])];
      for (const width of widths) {
        await test.step(`${state} / viewport ${width}px`, async () => {
          await page.setViewportSize({ width, height: 1000 });
          // CSS だけでなく React 側のモバイル切り替えも待ってから、幅と次の開閉操作を検査する。
          if (width >= SIDEBAR_BREAKPOINT) await expect(sidebar).toHaveAttribute('data-state', state);
          else await expect(sidebar).not.toBeAttached({ timeout: 15_000 });
          await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
          await assertLayout(page, target.rail);
          checks++;
        });
      }
    }
    console.log(`${target.path}: ${checks} layouts verified`);
  });
}
