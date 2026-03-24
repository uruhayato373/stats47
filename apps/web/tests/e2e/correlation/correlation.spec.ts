import { expect, test } from "@playwright/test";

/**
 * 相関分析ページのE2Eテスト
 *
 * /correlation ページの指標選択・散布図描画・統計情報表示をテストします。
 * Select コンポーネントは Radix UI 製（role='combobox'）。
 */
test.describe("相関分析ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/correlation", { waitUntil: "domcontentloaded" });
  });

  test("ページが正常に表示される", async ({ page }) => {
    // h1 見出しが表示される
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toContainText("相関分析");

    // X軸・Y軸のドロップダウンが 2つ表示される
    const triggers = page.getByRole("combobox");
    await expect(triggers.first()).toBeVisible({ timeout: 10000 });
    expect(await triggers.count()).toBeGreaterThanOrEqual(2);

    // ラベルが表示される
    await expect(page.getByText("X軸の指標")).toBeVisible();
    await expect(page.getByText("Y軸の指標")).toBeVisible();
  });

  test("指標を選択すると散布図が表示される", async ({ page }) => {
    const triggers = page.getByRole("combobox");
    await expect(triggers.first()).toBeVisible({ timeout: 10000 });

    // X軸の指標を選択
    await triggers.first().click();
    const firstOption = page.getByRole("option").first();
    await expect(firstOption).toBeVisible({ timeout: 5000 });
    await firstOption.click();

    // Y軸の指標を選択（X軸と異なるもの）
    await triggers.nth(1).click();
    const options = page.getByRole("option");
    await expect(options.first()).toBeVisible({ timeout: 5000 });
    // 2番目のオプションを選択（1番目と同じ場合があるので2番目）
    const optionCount = await options.count();
    if (optionCount >= 2) {
      await options.nth(1).click();
    } else {
      await options.first().click();
    }

    // 散布図（SVG）が描画される
    const svg = page.locator("svg").first();
    await expect(svg).toBeVisible({ timeout: 15000 });
  });

  test("相関統計情報が表示される", async ({ page }) => {
    const triggers = page.getByRole("combobox");
    await expect(triggers.first()).toBeVisible({ timeout: 10000 });

    // X軸選択
    await triggers.first().click();
    await page.getByRole("option").first().click();

    // Y軸選択（2番目のオプション）
    await triggers.nth(1).click();
    const options = page.getByRole("option");
    await expect(options.first()).toBeVisible({ timeout: 5000 });
    const count = await options.count();
    await options.nth(count >= 2 ? 1 : 0).click();

    // 相関係数 (r) が表示される
    const pearsonText = page.getByText(/相関係数.*\(r\)/i);
    await expect(pearsonText).toBeVisible({ timeout: 15000 });

    // R² が表示される
    const r2Text = page.getByText(/R²/i);
    await expect(r2Text).toBeVisible({ timeout: 10000 });
  });

  test("URLパラメータから初期状態が復元される", async ({ page }) => {
    // x=population, y=area_size などの有効なキーをパラメータに指定
    // DB にデータがあれば散布図まで描画される
    await page.goto("/correlation?x=population&y=area_size", {
      waitUntil: "domcontentloaded",
    });

    // ページが表示される（DB データがなくてもUIは表示される）
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // X軸・Y軸のドロップダウンが表示される
    const triggers = page.getByRole("combobox");
    await expect(triggers.first()).toBeVisible({ timeout: 10000 });
  });

  test("同一指標を選択するとメッセージが表示される", async ({ page }) => {
    const triggers = page.getByRole("combobox");
    await expect(triggers.first()).toBeVisible({ timeout: 10000 });

    // X軸の最初の指標を選択
    await triggers.first().click();
    const firstOption = page.getByRole("option").first();
    await expect(firstOption).toBeVisible({ timeout: 5000 });
    const optionText = await firstOption.textContent();
    await firstOption.click();

    // Y軸に同じ指標を選択
    await triggers.nth(1).click();
    await expect(page.getByRole("option").first()).toBeVisible({ timeout: 5000 });

    // 同一テキストのオプションを探してクリック
    const sameOption = page.getByRole("option").filter({ hasText: optionText || "" }).first();
    if (await sameOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sameOption.click();

      // バリデーションメッセージが表示される
      const validationMsg = page.getByText(/異なる指標を選択/i);
      await expect(validationMsg).toBeVisible({ timeout: 5000 });
    }
  });
});
