import { hrefFor } from "@stats47/data-configs/content/href";

import { ANALYSIS_PREVIEWS } from "../../src/features/products/analysis-previews.generated";
import { findStorefrontProduct } from "../../src/features/products/storefront";
import { STOREFRONT_PRODUCTS } from "../../src/features/products/storefront.generated";

import { expect, test } from "./fixtures";

/**
 * breakpoint 別レイアウト検証（本番スモーク）
 *
 * playwright.smoke.config.ts の responsive-* projects (375 / 768 / 1024 / 1280) で
 * 同一 spec を 4 viewport 実行し、PageShell のレイアウト契約を機械検証する:
 *
 *   1. 横スクロールが発生しない（breakpoint 崩れの最頻出症状）
 *   2. h1 が表示される
 * 右レールの実幅・切替境界・左メニュー開閉は rail-layout.spec.ts が検証する。
 *
 * 背景 (2026-07-03 運営総点検): 従来の Playwright は Desktop Chrome 単一で
 * breakpoint 別の表示検証がゼロだった。ranking と blog のサイドバー breakpoint
 * 不統一 (xl vs lg) も機械検出できなかったため、レール契約をテストとして固定する。
 * 正典: docs/01_技術設計/04_デザインシステム.md / PageShell.tsx
 */

const LAYOUT_PAGES = [
  { name: "ranking詳細", path: "/ranking/total-population" },
  { name: "blog詳細", path: "/blog/noodle-consumption-prefecture-character" },
  { name: "ホーム", path: "/" },
  { name: "カテゴリ", path: "/category/population" },
  { name: "都道府県詳細", path: "/areas/01000" },
  // テーマページは client fetch のチャートを多数積むため崩れやすい (2026-08-04 の重なり不具合)
  { name: "テーマ", path: "/themes/population-dynamics" },
];

async function assertNoHorizontalScroll(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  // 1px はスクロールバー等の誤差として許容
  expect(overflow, "横スクロールが発生している (breakpoint 崩れ)").toBeLessThanOrEqual(1);
}

test.describe("breakpoint 別レイアウト", () => {
  test("テーマの該当章と商品LPの作成例を同じ表示版で往復できる", async ({ page }) => {
    test.setTimeout(120_000);
    const published = findStorefrontProduct('data-p-01')!;
    const productPath = hrefFor('product', { slug: published.slug });
    await page.goto(productPath, { waitUntil: 'domcontentloaded' });
    const preview = await page.locator('[data-product-preview]').count() > 0;
    const displayed = preview ? ANALYSIS_PREVIEWS.find(item => item.id === published.id)! : published;
    const example = displayed.showcase!.find(item => item.kind === 'chart' && item.themeRefs?.length)!;
    const ref = example.themeRefs![0];
    const examplePath = `${productPath}#example-${example.id}`;
    const themeLink = page.locator(`#example-${example.id}`).getByRole('link', { name: `${ref.title}：${ref.sectionTitle} →`, exact: true });
    await expect(themeLink).toHaveAttribute('href', ref.href);
    await themeLink.click();
    await expect(page).toHaveURL(new RegExp(`${ref.href}$`), { timeout: 45_000 });
    const chapter = page.locator(`#theme-section-${ref.sectionKey}`);
    // Streaming may retain hidden markup while attaching the visible chapter.
    // Require exactly one visible link; do not pick the first duplicate.
    const productLink = chapter.locator(`[data-theme-product-links] a[href="${examplePath}"]:visible`);
    await expect(productLink).toHaveCount(1);
    await expect(productLink).toBeVisible();
    await expect(productLink.locator('..')).toContainText(preview ? '未公開の改訂案' : example.heading);
    await assertNoHorizontalScroll(page);
    await productLink.click();
    await expect(page).toHaveURL(new RegExp(`${examplePath}$`), { timeout: 45_000 });
    await expect(page.locator(`#example-${example.id}`)).toBeVisible();
    await assertNoHorizontalScroll(page);
    // 全国版と県別版は同じテーマレイアウトで同じ作成例へ案内する。
    await page.goto(`${hrefFor('area-theme', { areaCode: '39000', themeSlug: ref.themeKey })}#theme-section-${ref.sectionKey}`, { waitUntil: 'domcontentloaded' });
    await expect(productLink).toHaveCount(1);
    await expect(productLink).toBeVisible();
    expect(await productLink.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    await assertNoHorizontalScroll(page);
  });

  test("商品画像は節の枚数や商品によらず同じ掲載幅を保つ", async ({ page }) => {
    test.setTimeout(120_000);
    let referenceWidth: number | undefined;
    let referenceColumnStep: number | undefined;
    // 複数枚/節と1枚/節を比較する。幅が収まるだけでは、1枚だけ全幅に拡大される退行を検知できない。
    for (const product of STOREFRONT_PRODUCTS.filter(item => item.showcase?.length)) {
      const { slug } = product;
      await page.goto(`/products/${slug}`, { waitUntil: 'domcontentloaded' });
      const images = page.getByRole('region', { name: '商品詳細', exact: true }).locator('figure img');
      const revision = await page.locator('[data-product-preview]').count()
        ? ANALYSIS_PREVIEWS.find(revision => revision.id === product.id)
        : undefined;
      // 全データ商品の上部・末尾の販売導線を実際の通常URLで確認する。
      for (const placement of ['product_detail_top', 'product_detail_bottom']) {
        const purchase = page.locator(`[data-product-placement="${placement}"]`);
        await expect(purchase).toHaveCount(1);
        await expect(purchase.getByRole('link', { name: /noteで.*内容.*確認する/ })).toHaveAttribute('href', product.externalUrl);
      }
      await expect(images).toHaveCount([product, ...(revision ? [revision] : [])].reduce((sum, edition) => sum + edition.showcase!.reduce((total, section) => total + section.figures.length, 0), 0));
      await images.evaluateAll((elements) => elements.forEach((element) => { (element as HTMLImageElement).loading = 'eager'; }));
      await expect.poll(() => images.evaluateAll((elements) => elements.every((element) => {
        const image = element as HTMLImageElement;
        return image.complete && image.naturalWidth > 0;
      }))).toBe(true);
      const dimensions = await images.evaluateAll((elements) => elements.map((element) => {
        const image = element as HTMLImageElement;
        const { width, height, x } = image.getBoundingClientRect();
        return { width, height, x, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight };
      }));
      referenceWidth ??= dimensions[0].width;
      referenceColumnStep ??= dimensions[1].x - dimensions[0].x;
      expect(referenceWidth).toBeGreaterThan(0);
      expect(Math.abs(dimensions[1].x - dimensions[0].x - referenceColumnStep), `${slug}: 作成例を同じ列間隔で並べる`).toBeLessThanOrEqual(1);
      for (const image of dimensions) {
        expect(Math.abs(image.width - referenceWidth), `${slug}: 作成例・ファイル見本の掲載幅`).toBeLessThanOrEqual(1);
        expect(Math.abs(image.height - image.width * image.naturalHeight / image.naturalWidth), `${slug}: 元画像の縦横比`).toBeLessThanOrEqual(1);
      }
      await assertNoHorizontalScroll(page);
    }
  });

  test("開発中の通常商品LPは販売版を残して改訂案も表示し、収録内容を混同しない", async ({ page }) => {
    test.setTimeout(120_000);
    // 本番サーバーでは改訂ルートが404になる。開発中の通常URLの配線漏れを検知する。
    const probe = await page.goto(`/products/preview/${ANALYSIS_PREVIEWS[0].slug}`, { waitUntil: 'domcontentloaded' });
    test.skip(probe?.status() === 404, '改訂案は開発サーバー専用');
    expect(probe?.status()).toBe(200);
    for (const revision of ANALYSIS_PREVIEWS) {
      const published = STOREFRONT_PRODUCTS.find(product => product.id === revision.id)!;
      const path = `/products/${published.slug}`;
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(new URL(page.url()).pathname).toBe(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(published.displayTitle ?? published.title);
      await expect(page.locator('[data-product-preview]')).toHaveCount(1);
      for (const [key, edition] of [['published', published], ['revision', revision]] as const) {
        const region = page.locator(`[data-product-edition="${key}"]`);
        await expect(region).toHaveCount(1);
        for (const included of edition.included) await expect(region.getByText(included, { exact: true })).toBeVisible();
        const images = region.locator('figure img');
        await expect(images).toHaveCount(edition.showcase!.reduce((sum, section) => sum + section.figures.length, 0));
        for (const image of await images.all()) await expect(image).toHaveAttribute('src', new RegExp(`/${edition.slug}/showcase/`));
        for (const example of edition.showcase ?? []) if (example.id) await expect(region.locator(`#example-${example.id}`)).toHaveCount(1);
      }
      await expect(page.locator('[data-product-placement]')).toHaveCount(2);
      for (const purchase of await page.locator('[data-product-placement]').all()) {
        await expect(purchase.getByText('現在販売中の版', { exact: true })).toBeVisible();
        await expect(purchase.getByText(published.displayTitle ?? published.title, { exact: true })).toBeVisible();
        await expect(purchase.getByText(/改訂案のデータ・図は、現在販売中の版には含まれていません/)).toBeVisible();
        await expect(purchase.getByRole('link', { name: /noteで現在販売中の内容/ })).toHaveAttribute('href', published.externalUrl);
      }
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(structuredData.some(value => JSON.parse(value)['@type'] === 'Product')).toBe(false);
      await assertNoHorizontalScroll(page);
    }
  });

  for (const slug of ['data-muni-manufacturing', 'data-p-02', 'kindle-k-s1-02']) {
    test(`商品詳細 (${slug}) は商品内容を先に表示し、共通の余白を保つ`, async ({ page }) => {
      await page.goto(`/products/${slug}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await assertNoHorizontalScroll(page);
      const overview = page.getByRole('region', { name: '商品内容と購入' });
      await expect(overview.getByRole('heading', { name: '含まれるもの' })).toBeVisible();
      const product = findStorefrontProduct(slug)!;
      const useCases = product.useCases;
      await expect(overview.getByRole('heading', { name: useCases?.length ? 'こんな用途に' : 'こんな方へ' })).toBeVisible();
      for (const item of useCases ?? []) {
        await expect(overview.getByText(item.title, { exact: true })).toBeVisible();
        await expect(overview.getByText(item.description, { exact: true })).toBeVisible();
      }
      await expect(overview.getByRole('link', { name: /で.*内容を確認する/ })).toHaveCount(1);
      // 価格・購入先・対象読者を見本図より前に把握でき、狭い幅でもラベルが欠けない。
      const overviewLayout = await overview.evaluate((section) => {
        const main = section.closest('main')!;
        const firstFigure = main.querySelector('figure');
        return {
          isFirstSection: main.querySelector('[aria-label="商品内容と購入"]') === section,
          beforeFigures: !firstFigure || !!(section.compareDocumentPosition(firstFigure) & Node.DOCUMENT_POSITION_FOLLOWING),
          clipped: Array.from(section.querySelectorAll<HTMLElement>('a, dt, dd, [data-slot="badge"]'))
            .filter((element) => element.scrollWidth > element.clientWidth + 1).length,
        };
      });
      expect(overviewLayout).toEqual({ isFirstSection: true, beforeFigures: true, clipped: 0 });
      // LP 本文は1つの Surface。見出し・説明を別々の枠にして横線を増やさない。
      await expect(page.locator('main section[data-slot="card"]')).toHaveCount(1);
      const bottom = page.locator('[data-product-placement="product_detail_bottom"]');
      await expect(bottom.getByRole('link', { name: /で.*内容を確認する/ })).toHaveAttribute('href', new RegExp(product.externalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      await bottom.scrollIntoViewIfNeeded();
      await expect(bottom.getByText(product.displayTitle ?? product.title, { exact: true })).toBeVisible();
      if (product.coverImageUrl) {
        const cover = bottom.getByRole('img');
        await expect(cover).toBeVisible();
        // 外部配信の遅延読み込み画像は、レイアウト表示後の通信完了まで待つ。
        await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 15_000 }).toBe(true);
      } else {
        await expect(bottom.getByRole('img')).toHaveCount(0);
      }
      expect(await bottom.evaluate((element) => {
        const main = element.closest('main')!;
        const lastFigure = Array.from(main.querySelectorAll('figure')).at(-1);
        return (!lastFigure || !!(lastFigure.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING))
          && element.scrollWidth <= element.clientWidth + 1;
      })).toBe(true);
      await assertNoHorizontalScroll(page);
      const spacing = await page.locator('main').evaluate((main) => {
        const title = main.querySelector('h1')!;
        const headerStyle = getComputedStyle(title.closest('header')!);
        const titleLeft = title.getBoundingClientRect().left;
        return Array.from(main.querySelectorAll('section[data-slot="card"]'), (section) => {
          const style = getComputedStyle(section);
          const children = Array.from(section.children).filter((child) => child.getBoundingClientRect().height > 0);
          return {
            inset: style.paddingLeft,
            headerInset: headerStyle.paddingLeft,
            leftOffset: children[0].getBoundingClientRect().left - titleLeft,
            gap: parseFloat(style.rowGap),
            gaps: children.slice(1).map((child, i) => child.getBoundingClientRect().top - children[i].getBoundingClientRect().bottom),
          };
        });
      });
      expect(spacing.length).toBeGreaterThan(0);
      for (const section of spacing) {
        expect(section.inset).toBe(section.headerInset);
        expect(Math.abs(section.leftOffset)).toBeLessThanOrEqual(1);
        for (const gap of section.gaps) expect(Math.abs(gap - section.gap)).toBeLessThanOrEqual(1);
      }
    });
  }

  for (const target of LAYOUT_PAGES) {
    test(`${target.name} (${target.path}) が崩れず表示される`, async ({ page }) => {
      await page.goto(target.path, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({
        timeout: 15_000,
      });
      await assertNoHorizontalScroll(page);
    });
  }

});
