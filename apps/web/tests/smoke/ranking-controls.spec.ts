import { expect, test } from './fixtures';

for (const target of [
  { path: '/ranking/total-population', title: '都道府県別 総人口ランキング', municipality: true, calculation: true },
  { path: '/ranking/annual-sunshine-duration', title: '都道府県別 年間日照時間ランキング', municipality: false, calculation: false },
]) {
  test(`ランキングの操作と市区町村への導線 ${target.path}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(target.path, { waitUntil: 'load' });
    const chart = page.getByRole('region', { name: '都道府県別ランキング', exact: true });
    await expect(chart).toBeVisible({ timeout: 30_000 });
    const sources = page.getByTestId('data-source-section');
    await expect(sources).toHaveCount(1);
    await expect(sources.getByRole('link', { name: /社会・人口統計体系/ }).filter({ hasText: '社会・人口統計体系' })).toHaveCount(1);
    await expect(sources.getByRole('link').filter({ hasText: '統計表' }).first()).toHaveAttribute('href', /e-stat\.go\.jp\/dbview\?sid=/);
    await expect(sources.getByRole('link', { name: /歴史的行政区域データセット/ })).toHaveCount(1);
    await expect(chart.getByText(/^出典:/)).toHaveCount(0);
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText(target.title);
    const header = heading.locator('xpath=ancestor::header');
    const updated = header.locator('time');
    await expect(updated).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
    await expect(page.getByText(/^最終更新/)).toHaveCount(1);
    await expect(chart.getByText(/^最終更新/)).toHaveCount(0);
    await expect(page.getByText('計算方法を切替', { exact: true })).toHaveCount(0);
    await expect(page.getByText('この指標を市区町村で見る', { exact: true })).toHaveCount(0);
    const link = page.getByRole('link', { name: '市区町村別を見る', exact: true });
    await expect(link).toHaveCount(target.municipality ? 1 : 0);
    if (target.municipality) {
      await expect(chart.getByRole('link', { name: '市区町村別を見る' })).toBeVisible();
      await expect(link).toHaveAttribute('href', /\/municipalities\/ranking\//);
    }

    // 操作の出し分け、左メニュー、右レールの境界前後を走査する。
    for (const width of [375, 390, ...[640, 768, 1024, 1280, 1536, 1700].flatMap(value => [value - 1, value, value + 1]), 1440, 1920]) {
      await test.step(`${width}px`, async () => {
        await page.setViewportSize({ width, height: 1000 });
        await expect(updated).toBeVisible();
        const headingBox = (await heading.boundingBox())!;
        const dateBox = (await updated.boundingBox())!;
        expect(headingBox.x).toBeGreaterThanOrEqual(0);
        expect(headingBox.x + headingBox.width).toBeLessThanOrEqual(width);
        expect(dateBox.x + dateBox.width).toBeLessThanOrEqual(width);
        if (width < 640) {
          expect(dateBox.y).toBeGreaterThanOrEqual(headingBox.y + headingBox.height);
        } else {
          expect(dateBox.x).toBeGreaterThanOrEqual(headingBox.x + headingBox.width);
        }
        const sourceLayout = await sources.evaluate(el => {
          const style = getComputedStyle(el);
          const box = el.getBoundingClientRect();
          return { margin: style.marginTop, padding: style.paddingTop, border: style.borderTopWidth, fits: box.left >= 0 && box.right <= innerWidth };
        });
        expect(sourceLayout).toEqual({ margin: '0px', padding: '0px', border: '0px', fits: true });
        await expect(page.getByRole('button', { name: '共有', exact: true })).toBeVisible();
        if (target.municipality) {
          await expect(link).toBeVisible();
          const layout = await link.evaluate(el => {
            const panel = el.closest('[data-slot="card"]')!.getBoundingClientRect();
            const box = el.getBoundingClientRect();
            return {
              fits: box.x >= panel.x && box.right <= panel.right,
              headerWidth: el.closest('[data-slot="card-header"]')!.getBoundingClientRect().width,
              direction: getComputedStyle(el.parentElement!).flexDirection,
            };
          });
          expect(layout.fits).toBe(true);
          expect(layout.direction).toBe(layout.headerWidth >= 480 ? 'row' : 'column');
        }
        if (target.calculation) {
          const toggle = page.getByRole('button', { name: '面積100km²あたり', exact: true });
          if (width < 640) {
            await expect(page.getByRole('combobox', { name: '計算方法' })).toBeVisible();
            await expect(toggle).toBeHidden();
          } else {
            await expect(toggle).toBeVisible();
            await expect(page.getByRole('combobox', { name: '計算方法' })).toBeHidden();
          }
        }
        const colorGroup = page.locator('[data-slot="toggle-group"][aria-label="地図の塗り方"]');
        await expect(colorGroup).toBeVisible();
        const choice = colorGroup.locator('button[aria-pressed="false"]').first();
        const choiceName = await choice.innerText();
        await choice.click();
        const selected = colorGroup.getByRole('button', { name: choiceName, exact: true });
        await expect(selected).toHaveAttribute('aria-pressed', 'true');
        await selected.click();
        await expect(selected).toHaveAttribute('aria-pressed', 'true');
        await expect(colorGroup.locator('button[aria-pressed="true"]')).toHaveCount(1);
        const styles = await selected.evaluate(el => {
          const style = getComputedStyle(el);
          return { height: el.getBoundingClientRect().height, background: style.backgroundColor, color: style.color, font: style.fontSize };
        });
        if (width < 640) expect(styles.height).toBeGreaterThanOrEqual(44);
        if (width >= 640 && target.calculation) {
          const calculation = page.locator('[aria-label="計算方法"] button[aria-pressed="true"]');
          const expectedStyle = await calculation.evaluate(el => {
            const style = getComputedStyle(el);
            return { height: el.getBoundingClientRect().height, background: style.backgroundColor, color: style.color, font: style.fontSize };
          });
          // 選択背景の transition が終わってから比較する。
          await expect.poll(() => selected.evaluate(el => {
            const style = getComputedStyle(el);
            return { height: el.getBoundingClientRect().height, background: style.backgroundColor, color: style.color, font: style.fontSize };
          })).toEqual(expectedStyle);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        await page.getByRole('button', { name: '共有', exact: true }).click();
        const menu = page.getByRole('menu');
        await expect(menu.getByRole('menuitem')).toHaveCount(5);
        const bounds = await menu.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
        await page.keyboard.press('Escape');
        await expect(menu).toBeHidden();
      });
    }

    // 表示だけでなくPC/モバイル双方の計算切替が動くこと。
    if (target.calculation) {
      const option = page.getByRole('button', { name: '面積100km²あたり', exact: true });
      await option.click();
      await expect(option).toHaveAttribute('aria-pressed', 'true', { timeout: 30_000 });
      await expect(heading).toHaveText('都道府県別 総人口（面積100km²あたり）ランキング');
      await page.setViewportSize({ width: 375, height: 1000 });
      await page.getByRole('combobox', { name: '計算方法' }).click();
      await page.getByRole('option', { name: '総数', exact: true }).click();
      await expect(page.getByRole('combobox', { name: '計算方法' })).toHaveText(/総数/);
      await expect(heading).toHaveText(target.title);
    }
  });
}
