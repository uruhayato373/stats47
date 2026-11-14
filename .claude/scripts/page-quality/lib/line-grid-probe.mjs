// 線の格子 (PanelGrid・docs/01_技術設計/04_デザインシステム.md「見本の実測値と部品の仕様」) を、描いた画面で検査する判定。
// 検査の本体はこの 1 か所だけに持つ。週次の page-quality (lib/ui-probe.ts の line_grid_issues) と、
// 手元の本番ビルドに流す npm run ui-theme:line-grid (.claude/scripts/ui/check-line-grid.mjs) が同じ関数を使う。
// 本文の列 (div[data-slot=shell-main] を含む格子) の中で次を数える。
// - outside-grid: パネルが格子の外にある (パネル自身の線が残り、隣と線を共有しない)
// - mixed-cell: パネルを含むセルが文章・見出しも直に持つ (パネルを含むセルは余白を持たないので、文章が線に接する)
// 静的な検査 (design-system:check の panels-in-line-grid) は書き方を止め、こちらは描いた結果を見る。

/**
 * ページ内で実行する判定。page.evaluate に渡すため外側の変数を参照しない。
 * 本文の列の格子が無い画面 (noColumn) は対象外で、違反 0 件として扱う。
 * @returns {{ noColumn?: boolean, issues: string[] }}
 */
export function collectLineGridIssues() {
  const root = document.querySelector("body > div.relative") ?? document.body;
  const column = root.querySelector("[data-slot=shell-main]")?.closest("[data-slot=panel-grid]");
  if (!column) return { noColumn: true, issues: [] };
  const outer = column.parentElement?.closest("[data-slot=panel-grid]") ?? column;
  const issues = [];
  const label = (el) =>
    `${el.tagName.toLowerCase()}.${(el.getAttribute("class") ?? "").slice(0, 60)} | ${(el.innerText ?? "").replace(/\s+/g, " ").slice(0, 30)}`;
  const visible = (el) => el.offsetParent !== null || getComputedStyle(el).position === "fixed";
  // (1) 本文の列の中で格子の外にあるパネル
  for (const card of outer.querySelectorAll("[data-slot=card]")) {
    if (!visible(card)) continue;
    const parent = card.parentElement;
    if (parent?.closest("[data-slot=card]")) continue; // パネルの中の部品 (状態表示など)
    // 格子 (rail-stack は格子の中で線を共有する) の直下、または「子が 1 つだけの包み」を辿って格子に着けば可
    let el = card;
    let ok = false;
    while (el.parentElement) {
      const p = el.parentElement;
      if (p.matches("[data-slot=panel-grid],[data-slot=rail-stack]")) {
        ok = true;
        break;
      }
      if ([...p.children].filter(visible).length !== 1) break;
      el = p;
    }
    if (ok) continue;
    issues.push(`outside-grid  ${label(card)}`);
  }
  // (2) パネルを含むセルが、パネル以外の要素も直に持つ
  for (const grid of outer.querySelectorAll("[data-slot=panel-grid]")) {
    for (const cell of grid.children) {
      if (!visible(cell) || cell.matches("[data-slot=card],[data-slot=panel-grid],[data-slot=section-divider],[data-slot=rail-stack]")) continue;
      if (!cell.querySelector("[data-slot=card]")) continue;
      // 子が 1 つだけの包みは中へ辿る
      let box = cell;
      while (
        [...box.children].filter(visible).length === 1 &&
        !box.firstElementChild.matches("[data-slot=card],[data-slot=panel-grid],[data-slot=rail-stack]")
      ) {
        box = [...box.children].filter(visible)[0];
      }
      const loose = [...box.children].filter(
        (c) => visible(c) && !c.matches("[data-slot=card],[data-slot=panel-grid],[data-slot=rail-stack]") && (c.innerText ?? "").trim()
      );
      if (loose.length) issues.push(`mixed-cell    ${label(cell)} :: ${loose.map((c) => c.tagName.toLowerCase()).join(",")}`);
    }
  }
  return { issues };
}

/**
 * tsx (esbuild keepNames) は関数本体に `__name(...)` を差し込むため、page.evaluate へ関数をそのまま
 * 渡すとブラウザ側で ReferenceError になる。文字列化し、同名の恒等関数を定義してから評価する (ui-probe.ts と同じ理由)。
 * @param {import("playwright").Page} page
 * @returns {Promise<{ noColumn?: boolean, issues: string[] }>}
 */
export function evaluateLineGridIssues(page) {
  return page.evaluate(`(() => { const __name = (fn) => fn; return (${collectLineGridIssues.toString()})(); })()`);
}
