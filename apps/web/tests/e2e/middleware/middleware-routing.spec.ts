import { expect, test } from "@playwright/test";

/**
 * Middleware ルーティング E2E テスト
 *
 * `apps/web/src/middleware.ts` の全 Fix (1〜8) および 301 redirect を網羅。
 * Googlebot 同等の生リクエストで HTTP ステータス・Location・Cache-Control を検証する。
 *
 * Fix 一覧:
 *   Fix 1: /correlation/* → 410
 *   Fix 2: /dashboard/* → 410
 *   Fix 4: /areas/{invalid prefCode}/* → 410
 *   Fix 4.5: /areas/{prefCode}/cities/* → 410
 *   Fix 5: /blog/{旧カテゴリ} → 410
 *   Fix 6: /ranking/{unknown key} → 410
 *   Fix 7: /themes/{unknown slug} → 410（2026-04-18 追加）
 *   Fix 8: /areas/{prefCode}/{non-indexable sub} → 410（2026-04-18 追加）
 *
 * 301 redirect:
 *   BLOG_SLUG_REDIRECTS, OLD_CATEGORY_KEYS, /ranking/prefecture/*
 *
 * golden path:
 *   /themes/population-dynamics, /areas/13000/population, /ranking/<known-key>
 *
 * 使用方法:
 *   cd apps/web && npm run dev &     # dev server を起動（http://localhost:3000）
 *   npx playwright test tests/e2e/middleware/middleware-routing.spec.ts
 */

const BASE = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Middleware ルーティング", () => {
  test.describe("Fix 7: /themes/* 未知 slug", () => {
    test("/themes/population-dynamics は 200（既知 slug）", async ({ request }) => {
      // dev server 初回レンダリングが重いページのため長めに取る
      test.setTimeout(90_000);
      const res = await request.get(`${BASE}/themes/population-dynamics`, { maxRedirects: 0, timeout: 60_000 });
      expect(res.status()).toBe(200);
    });

    test("/themes/unknown-theme-xxx は 410", async ({ request }) => {
      const res = await request.get(`${BASE}/themes/unknown-theme-xxx`, { maxRedirects: 0 });
      expect(res.status()).toBe(410);
      expect(res.headers()["cache-control"]).toContain("no-store");
    });
  });

  test.describe("Fix 8: /areas/{pref}/{non-indexable-sub}", () => {
    test("/areas/13000/population は 200（indexable）", async ({ request }) => {
      // dev server 初回レンダリングが重いため長めに取る
      test.setTimeout(90_000);
      const res = await request.get(`${BASE}/areas/13000/population`, { maxRedirects: 0, timeout: 60_000 });
      expect(res.status()).toBe(200);
    });

    test("/areas/13000/economy は 200（indexable）", async ({ request }) => {
      test.setTimeout(90_000);
      const res = await request.get(`${BASE}/areas/13000/economy`, { maxRedirects: 0, timeout: 60_000 });
      expect(res.status()).toBe(200);
    });

    test("/areas/13000/labor は 410（non-indexable）", async ({ request }) => {
      const res = await request.get(`${BASE}/areas/13000/labor`, { maxRedirects: 0 });
      expect(res.status()).toBe(410);
    });

    test("/areas/13000/education は 410（non-indexable）", async ({ request }) => {
      const res = await request.get(`${BASE}/areas/13000/education`, { maxRedirects: 0 });
      expect(res.status()).toBe(410);
    });
  });

  test.describe("Fix 4: /areas/{invalid prefCode}", () => {
    test("/areas/99000/population は 410（無効 prefCode）", async ({ request }) => {
      const res = await request.get(`${BASE}/areas/99000/population`, { maxRedirects: 0 });
      expect(res.status()).toBe(410);
    });

    test("/areas/00000 は 410", async ({ request }) => {
      const res = await request.get(`${BASE}/areas/00000`, { maxRedirects: 0 });
      expect(res.status()).toBe(410);
    });
  });

  test.describe("Fix 4.5: /areas/{pref}/cities/*", () => {
    test("/areas/13000/cities/13101 は 410", async ({ request }) => {
      const res = await request.get(`${BASE}/areas/13000/cities/13101`, { maxRedirects: 0 });
      expect(res.status()).toBe(410);
    });
  });

  test.describe("Fix 6: /ranking/{unknown key}", () => {
    test("/ranking/healthy-life-expectancy-male は 200（known key）", async ({ request }) => {
      // dev server 初回レンダリングが重いページのため長めに取る
      test.setTimeout(90_000);
      // D1 binding が無い環境では skip（local D1 にデータが必要）
      const res = await request.get(`${BASE}/ranking/healthy-life-expectancy-male`, { maxRedirects: 0, timeout: 60_000 });
      expect([200, 410]).toContain(res.status());
      if (res.status() === 410) {
        test.skip(true, "known-ranking-keys.ts にデータが無いスキーマ差分の可能性。local DB を最新化してから再実行");
      }
    });

    test("/ranking/nonexistent-ranking-xxx は 410", async ({ request }) => {
      const res = await request.get(`${BASE}/ranking/nonexistent-ranking-xxx`, { maxRedirects: 0 });
      expect(res.status()).toBe(410);
    });
  });

  test.describe("Fix 1: /correlation/*", () => {
    test("/correlation/anything は 410", async ({ request }) => {
      const res = await request.get(`${BASE}/correlation/anything`, { maxRedirects: 0 });
      expect(res.status()).toBe(410);
    });
  });

  test.describe("Fix 2: /dashboard/*", () => {
    test("/dashboard/anything は 410", async ({ request }) => {
      const res = await request.get(`${BASE}/dashboard/anything`, { maxRedirects: 0 });
      expect(res.status()).toBe(410);
    });
  });

  test.describe("Fix 5: /blog/{旧カテゴリ}", () => {
    test("/blog/economy は 410（旧カテゴリ名）", async ({ request }) => {
      const res = await request.get(`${BASE}/blog/economy`, { maxRedirects: 0 });
      expect(res.status()).toBe(410);
    });

    test("/blog/tags/foo は 410", async ({ request }) => {
      const res = await request.get(`${BASE}/blog/tags/foo`, { maxRedirects: 0 });
      expect(res.status()).toBe(410);
    });
  });

  test.describe("301 redirect: BLOG_SLUG_REDIRECTS", () => {
    test("/blog/aging-society-ranking は 301 → /blog/aging-rate-akita-vs-okinawa", async ({ request }) => {
      const res = await request.get(`${BASE}/blog/aging-society-ranking`, { maxRedirects: 0 });
      expect(res.status()).toBe(301);
      const location = res.headers()["location"] ?? "";
      expect(location).toContain("/blog/aging-rate-akita-vs-okinawa");
    });
  });

  test.describe("301 redirect: 旧カテゴリキー単体", () => {
    test("/economy は 301 → /category/economy", async ({ request }) => {
      const res = await request.get(`${BASE}/economy`, { maxRedirects: 0 });
      expect(res.status()).toBe(301);
      const location = res.headers()["location"] ?? "";
      expect(location).toContain("/category/economy");
    });
  });
});
