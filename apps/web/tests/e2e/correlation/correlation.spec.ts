import { expect, test } from "@playwright/test";

test.describe("廃止済み相関分析ページ", () => {
  test("/correlation は 410 を返す", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/correlation`, {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(410);
  });

  test("/correlation/* も 410 を返す", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/correlation/anything`, {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(410);
  });
});
