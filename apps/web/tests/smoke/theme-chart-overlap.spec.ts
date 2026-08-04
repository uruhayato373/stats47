import { expect, test } from "@playwright/test";

/**
 * テーマページのチャートがカード枠を守っているか（本番スモーク）
 *
 * ★背景 (2026-08-04 /themes/population-dynamics): D3 チャートは `viewBox` + `h-auto w-full` で
 *   「コンテナ幅からしか高さが決まらない」ため、固定高 div (`h-[200px]`) で包むと SVG が
 *   はみ出す。実測で SVG 349px / 枠 200px、出典と「ランキングを見る」に **154px 重なっていた**。
 *
 *   静的検査 (check-design-system の no-fixed-height-around-aspect-ratio-chart) が
 *   ソース側の再発を止めるが、「実際に描画したら重なる」形の崩れ (凡例の折り返し増加・
 *   フォント差など) はブラウザで測らないと分からない。ここは本番の実測を担う。
 *
 * 検査: チャートカード (footer 付きパネル) ごとに
 *   1. SVG の下端が footer の上端を越えない (重なりゼロ)
 *   2. SVG の下端がカード下端を越えない (カード外へはみ出さない)
 *   3. SVG に描画要素がある (空チャートでないこと = 検査が素通りしていないことの担保)
 */

const THEME_PATHS = [
  "/themes/population-dynamics",
  "/themes/healthcare",
];

interface CardMetric {
  title: string;
  overlapFooterPx: number;
  spillCardPx: number;
  shapeCount: number;
}

test.describe("テーマチャートがカード枠を守る", () => {
  for (const path of THEME_PATHS) {
    test(`${path} のチャートが footer に重ならない`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });

      // チャートは client fetch なので、描画されたカード数が増えなくなるまで待つ。
      // (テーマによって 10 個近く並び、e-Stat 取得の遅い系列が後から現れる)
      const countRenderedCards = () =>
        page.evaluate(
          () =>
            [...document.querySelectorAll('div[class*="border-t"]')].filter((footer) => {
              if (/fixed|sticky/.test(footer.className)) return false;
              const card = footer.parentElement;
              return (
                !!card &&
                card !== document.body &&
                !!card.querySelector("h3") &&
                !!card.querySelector("svg:not(.lucide) path, svg:not(.lucide) rect")
              );
            }).length,
        );

      await expect
        .poll(countRenderedCards, { timeout: 90_000, intervals: [1_000] })
        .toBeGreaterThan(0);

      let previous = -1;
      for (let i = 0; i < 20 && previous !== (previous = await countRenderedCards()); i++) {
        await page.waitForTimeout(2_000);
      }

      const cards: CardMetric[] = await page.evaluate(() => {
        const out: CardMetric[] = [];
        for (const footer of document.querySelectorAll('div[class*="border-t"]')) {
          // ChartPanel の footer だけを対象にする (固定バー・記事内の区切り線を除外)
          if (/fixed|sticky/.test(footer.className)) continue;
          const card = footer.parentElement;
          if (!card || card === document.body) continue;
          const heading = card.querySelector("h3");
          if (!heading) continue;
          // ★footer の中にある SVG は「チャートのはみ出し」ではないので必ず除く。
          //   本番では AdSense 等が出典テキストのキーワードを href="#" のリンク + アイコン SVG に
          //   置換することがあり (2026-08-04 実測: 出典「人口動態統計」の "統計" が置換)、
          //   これを数えると常に footer 内 = 正の overlap になり誤検知する。
          const svgs = [...card.querySelectorAll("svg:not(.lucide)")].filter(
            (svg) => !footer.contains(svg),
          );
          if (svgs.length === 0) continue;

          const footerTop = footer.getBoundingClientRect().top;
          const cardBottom = card.getBoundingClientRect().bottom;
          const maxSvgBottom = Math.max(
            ...svgs.map((s) => s.getBoundingClientRect().bottom),
          );
          out.push({
            title: heading.textContent?.trim().slice(0, 40) ?? "",
            overlapFooterPx: Math.round(maxSvgBottom - footerTop),
            spillCardPx: Math.round(maxSvgBottom - cardBottom),
            shapeCount: svgs.reduce(
              (n, svg) => n + svg.querySelectorAll("path, rect, circle").length,
              0,
            ),
          });
        }
        return out;
      });

      // 検査対象が 0 件なら「全部 pass」と区別がつかないので明示的に落とす
      expect(cards.length, "チャートカードを 1 枚も検出できなかった").toBeGreaterThan(0);

      for (const card of cards) {
        expect(
          card.overlapFooterPx,
          `${card.title}: チャートが footer に ${card.overlapFooterPx}px 重なっている`,
        ).toBeLessThanOrEqual(0);
        expect(
          card.spillCardPx,
          `${card.title}: チャートがカード外へ ${card.spillCardPx}px はみ出している`,
        ).toBeLessThanOrEqual(0);
        expect(
          card.shapeCount,
          `${card.title}: SVG に描画要素が無い (空チャート)`,
        ).toBeGreaterThan(0);
      }
    });
  }
});
