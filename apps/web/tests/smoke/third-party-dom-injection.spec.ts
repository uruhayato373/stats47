import { expect, test } from "@playwright/test";

/**
 * 第三者スクリプトによる本文書き換えの検知 (SOURCE-TEXT-LINK-INJECTION-01)
 *
 * ★何を守るか: **本文・出典テキストの中の語が、hydration 後にリンクへ置き換えられていないこと**。
 *
 * 2026-08-04 の post-deploy smoke (run 30876315662) の error-context.md に
 * `link "統計" /url: "#"` が記録された。チャート footer の「出典: 人口動態統計」の
 * 「統計」だけがリンク + アイコンになり、リンク先は機能しない `#` だった。本文でも
 * 「人口」「旅行ガイド、旅行記」が同様に置換されていた。出典の信頼性を損ない、
 * PR 表記の無いアフィリエイトリンクが引用文の中に生まれることになる。
 *
 * ★出所は **AdSense の自動広告**。オーナーが 2026-08-21 に設定を解除した。
 *
 * ★`app/layout.tsx` と `app/global-error.tsx` の body は Google 公式の
 *   `google-anno-skip` を常設する。これにより管理画面の設定が変わっても、
 *   広告インテントのリンク・アンカー・チップを全ページで拒否する。
 *   このテストは class の存在と、症状が出ていないことの両方を固定する。
 *
 * ★**AdSense 停止中に症状が出ないことだけでは証拠にならない**。
 *   2026-08-04 に捕捉 → **2026-08-16 に `ADSENSE_DISPLAY_ENABLED=false`** で
 *   `adsbygoogle.js` ごと停止 → 2026-08-21 の実測で再現せず、という順序で、
 *   「停止したから撃てなくなった」だけである。`ADSENSE_DISPLAY_ENABLED=true` に戻したあとの
 *   実測が唯一の根拠になる。再開手順は `.claude/rules/affiliate-ads-standards.md` §12。
 *   (私は停止の 5 日後に観測して一度「AdSense ではない」と誤結論した。
 *    現在の状態から過去の事象を推論しない。)
 *
 * 判定の作り方: `href="#"` を全部拾うと誤検知する。実測で 2 種類の正当な `#` が居た。
 *   1. **ライブラリの UI コントロール** — Leaflet のズーム (`a.leaflet-control-zoom-in`)。
 *      最初の版はこれで `/ranking/total-population` を落とした。
 *   2. **自分たちのフォールバック** — `features/blog/components/md-content.tsx` の
 *      `source-link` / `related-article-link` / banner は、記事側が href を書き忘れると
 *      `href={href ?? "#"}` でカードやバナーとして描画される。
 *      (最初「自分たちは `#` を出力しない」と書いたが誤りで、リテラル検索しか
 *       していなかった。`?? "#"` の 4 箇所を見落としていた。)
 *
 * そこで**症状そのもの**で判定する: 注入は「文章の中の 1 語だけがリンクになる」形で現れる。
 * 上の 2 種はどちらも**兄弟テキストを持たない**(ボタン単体・ブロック要素のカード) ので、
 * **親要素に他の文字が同居しているインラインの `#` リンク**だけを拾えば分離できる。
 */

/** 注入が観測されたページ + 出典テキストが多いページ。 */
const PAGES = ["/themes/population-dynamics", "/blog/accommodation-expenditure-ranking", "/ranking/total-population"];

/**
 * 広告スクリプトは requestIdleCallback で遅れて読み込まれ、そこから DOM を触る。
 * 読み込み前に判定すると、注入があっても緑になってしまう。
 */
const SETTLE_MS = 12_000;

test.describe("第三者スクリプトの本文書き換え", () => {
  for (const path of PAGES) {
    test(`${path}: 本文が href="#" のリンクに置換されない`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toHaveClass(/google-anno-skip/);
      await page.waitForTimeout(SETTLE_MS);

      const injected = await page.$$eval('a[href="#"]', (as) =>
        as
          .filter((a) => (a.textContent ?? "").trim().length > 0)
          // 親に**生のテキストノード**が同居している = 文章の一部がリンクになった、という症状そのもの。
          // ★兄弟「要素」の文字を数えてはいけない。Leaflet のズームは + と − の <a> が隣り合うので、
          //   要素も数えると互いを兄弟テキストとみなして誤検知する (実測で踏んだ)。
          .filter((a) => {
            const siblingText = [...(a.parentElement?.childNodes ?? [])]
              .filter((n) => n !== a && n.nodeType === 3)
              .map((n) => (n.textContent ?? "").trim())
              .join("");
            return siblingText.length > 0;
          })
          .map((a) => ({
            text: (a.textContent ?? "").trim().slice(0, 40),
            className: a.className,
            parentTag: a.parentElement?.tagName,
            context: (a.closest("figure,footer,section,article,p")?.textContent ?? "").trim().slice(0, 120),
          })),
      );

      expect(
        injected,
        `本文中の語がリンクへ置換されている (AdSense 自動広告の再発を疑う): ${JSON.stringify(injected)}`,
      ).toEqual([]);
    });
  }
});
