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
 * ★出所は**まだ特定できていない** (2026-08-21 実測)。分かっているのは次まで:
 *   - AdSense ではない。`adsbygoogle.js` は表示停止中で読み込まれてすらいない。
 *   - 読み込まれる第三者は a8.net 系・GTM・GA・Cloudflare Insights のみ。
 *   - ただし **A8 リンクマネージャーの公式仕様は「広告主サイトへのリンクを A8 の
 *     アフィリエイトリンクに置換する」URL 書き換えで、平文をリンク化する機能ではない**
 *     (support.a8.net/as/linkmanager)。したがって「人口動態統計」の「統計」だけが
 *     リンクになる断片単位の置換は、この仕様では説明できない。
 *   犯人を決め打ちせず、**再発したら中身を出して特定する**のがこのテストの役目。
 *
 * ★このテストが今日は緑なのは正しい。同日に headless / headed × themes / blog の 4 通りを
 *   最大 36 秒スクロールしながら観測して**再現しなかった**。断続的か A8 側の設定変更で
 *   止まっている。再現しないものは直せないので、**戻ってきたときに気づけるようにする**のが
 *   このテストの役割。緑であること自体が「今は起きていない」という観測になる。
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
 * リンクマネージャーは 3 秒の idle 遅延の後に読み込まれ、そこから DOM を走査する。
 * 読み込み前に判定すると、注入があっても緑になってしまう。
 */
const SETTLE_MS = 12_000;

test.describe("第三者スクリプトの本文書き換え", () => {
  for (const path of PAGES) {
    test(`${path}: 本文が href="#" のリンクに置換されない`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto(path, { waitUntil: "domcontentloaded" });
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
        `本文中の語がリンクへ置換されている。出所は未特定なので、この中身から特定する: ${JSON.stringify(injected)}`,
      ).toEqual([]);
    });
  }
});
