import { expect, test } from './fixtures';

for (const target of [
  { path: '/areas', label: '地方' },
  { path: '/themes/freight-logistics', label: '輸送機関' },
  { path: '/themes/education-culture', label: '文化財の種類で絞り込み' },
]) {
  test(`単一選択の折り返しと操作 ${target.path}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(target.path, { waitUntil: 'domcontentloaded' });
    const group = page.locator(`[data-slot="toggle-group"][aria-label="${target.label}"]`);
    await expect(group).toBeVisible({ timeout: 60_000 });
    // ボタンは transition-all を持つ。幅を変えた直後の min-height は 0 から 44px へ補間中の値
    // (実測: 20.6px / 30.6px で 32px の高さが返る) になるので、寸法は遷移を止めて測る。
    // 緩めるのは測定の瞬間だけで、44px 以上という条件は同じ。rail-layout.spec.ts と同じ手段。
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    for (const width of [375, 639, 640, 641, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await group.scrollIntoViewIfNeeded();
      const items = await group.getByRole('button').evaluateAll(buttons => buttons.map(button => {
        const { left, right, height } = button.getBoundingClientRect();
        return { left, right, height, selected: button.getAttribute('aria-pressed') === 'true' };
      }));
      expect(items.filter(item => item.selected)).toHaveLength(1);
      for (const item of items) {
        expect(item.left).toBeGreaterThanOrEqual(0);
        expect(item.right).toBeLessThanOrEqual(width);
        if (width < 640) expect(item.height).toBeGreaterThanOrEqual(44);
      }
    }
    const next = group.locator('button[aria-pressed="false"]').first();
    const label = await next.innerText();
    await next.click();
    await expect(group.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await group.getByRole('button', { name: label, exact: true }).click();
    await expect(group.locator('button[aria-pressed="true"]')).toHaveCount(1);
  });
}
