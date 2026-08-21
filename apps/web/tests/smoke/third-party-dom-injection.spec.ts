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
 * ★出所は AdSense ではない (2026-08-21 実測で訂正)。本番で読み込まれる第三者スクリプトのうち
 *   本文を書き換えうるのは **A8 リンクマネージャー** (`statics.a8.net/a8link/a8linkmgr.js`、
 *   `apps/web/src/lib/a8net/A8LinkManager.tsx` が layout から全ページに入れている) だけで、
 *   AdSense の `adsbygoogle.js` は表示停止中で読み込まれてすらいなかった。
 *
 * ★このテストが今日は緑なのは正しい。同日に headless / headed × themes / blog の 4 通りを
 *   最大 36 秒スクロールしながら観測して**再現しなかった**。断続的か A8 側の設定変更で
 *   止まっている。再現しないものは直せないので、**戻ってきたときに気づけるようにする**のが
 *   このテストの役割。緑であること自体が「今は起きていない」という観測になる。
 *
 * 判定が成立する根拠: 自分たちのコードは `href="#"` を一度も出力しない
 * (apps/web と packages 配下の src を全文検索して 0 件)。したがって `#` リンクの存在は
 * そのまま外部注入の証拠になる。
 *
 * ★ただし**ライブラリが出す UI コントロールは別**。最初にこのテストを書いたとき
 *   `/ranking/total-population` が落ちたが、中身は Leaflet のズーム
 *   (`a.leaflet-control-zoom-in` / `-out`) で、注入ではなかった。誤検知を出すゲートは
 *   運用で無効化されるので、**役割がボタンのもの**と**地図ウィジェット内**を除外する。
 *   残るのは「文章の中の語がリンクになっている」ものだけになる。
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
          // ライブラリの UI コントロール (Leaflet のズーム等) は注入ではない
          .filter((a) => a.getAttribute("role") !== "button")
          .filter((a) => !a.closest('[class*="leaflet"]'))
          .filter((a) => (a.textContent ?? "").trim().length > 0)
          .map((a) => ({
            text: (a.textContent ?? "").trim().slice(0, 40),
            className: a.className,
            context: (a.closest("figure,footer,section,article,p")?.textContent ?? "").trim().slice(0, 120),
          })),
      );

      expect(
        injected,
        `本文中の語がリンクへ置換されている (出所は A8 リンクマネージャーの可能性が高い): ${JSON.stringify(injected)}`,
      ).toEqual([]);
    });
  }
});
