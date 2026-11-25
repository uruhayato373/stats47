// 線の格子 (PanelGrid・docs/01_技術設計/04_デザインシステム.md「見本の実測値と部品の仕様」) を、描いた画面で検査する判定。
// 検査の本体はこの 1 か所だけに持つ。週次の page-quality (lib/ui-probe.ts の line_grid_issues) と、
// 手元の本番ビルドに流す npm run ui-theme:line-grid (.claude/scripts/ui/check-line-grid.mjs) が同じ関数を使う。
// 本文の列 (div[data-slot=shell-main] を含む格子) の中で次を数える。
// - outside-grid: パネルが格子の外にある (パネル自身の線が残り、隣と線を共有しない)
// - mixed-cell: パネルを含むセルが文章・見出しも直に持つ (パネルを含むセルは余白を持たないので、文章が線に接する)
// - own-border: 格子の段 (格子の直下の要素) が自分でも枠を持つ。格子の線のすぐ内側にもう 1 本の線が出て 2 重に見える
//   (2026-11-18 市区町村ランキングの「分布の要点」と商品の案内の段)。段の内側に余白を空けて置いた枠付きの表は数えない
// - edge-double: 外枠の線 (ヘッダー下線・フッター上線・SidebarInset の outline) と本文の格子・右レールのカードの線が 1px ずれて並ぶ
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
      if (!visible(cell) || cell.matches("[data-slot=card],[data-slot=panel-grid],[data-slot=rail-stack]")) continue;
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
  // (3) 格子の段が自分でも枠を持つ (パネル [data-slot=card] は格子が枠を消すので対象外)
  for (const grid of outer.querySelectorAll("[data-slot=panel-grid]")) {
    for (const cell of grid.children) {
      if (!visible(cell) || cell.matches("[data-slot=card],[data-slot=panel-grid],[data-slot=rail-stack]")) continue;
      const st = getComputedStyle(cell);
      const sides = ["Top", "Right", "Bottom", "Left"].filter(
        (side) => parseFloat(st[`border${side}Width`]) > 0 && st[`border${side}Style`] !== "none"
      );
      if (sides.length >= 2) issues.push(`own-border    ${label(cell)}`);
    }
  }
  // (4) 外枠の線 (ヘッダーの下線・フッターの上線・SidebarInset の outline) と、本文の格子のセルの影・右レールのカードの線が
  // 1px ずれて並ぶ (2026-11-25。本文の余白をなくした後も格子が外枠の p-px を持ち、4 辺が 2 重に見えた)
  const inset = column.closest("[data-slot=sidebar-inset]");
  if (inset) {
    const box = inset.getBoundingClientRect();
    const shellLines = [];
    const header = inset.querySelector(":scope > header");
    if (header && parseFloat(getComputedStyle(header).borderBottomWidth) > 0) {
      const r = header.getBoundingClientRect();
      shellLines.push({ name: "header", o: "H", pos: r.bottom - 1, a: r.left, b: r.right });
    }
    const footer = inset.querySelector(":scope > footer");
    if (footer && parseFloat(getComputedStyle(footer).borderTopWidth) > 0) {
      const r = footer.getBoundingClientRect();
      shellLines.push({ name: "footer", o: "H", pos: r.top, a: r.left, b: r.right });
    }
    const ist = getComputedStyle(inset);
    const ow = parseFloat(ist.outlineWidth);
    if (ist.outlineStyle !== "none" && ow > 0) {
      const off = (parseFloat(ist.outlineOffset) || 0) + ow;
      shellLines.push({ name: "outline-left", o: "V", pos: box.left - off, a: box.top, b: box.bottom });
      shellLines.push({ name: "outline-right", o: "V", pos: box.right + off - ow, a: box.top, b: box.bottom });
    }
    // 中の線は SidebarInset の overflow-clip で切られる位置にあれば見えない
    const inside = (o, pos) => (o === "H" ? pos >= box.top && pos < box.bottom : pos >= box.left && pos < box.right);
    const contentLines = [];
    for (const cell of outer.children) {
      if (!visible(cell)) continue;
      const r = cell.getBoundingClientRect();
      contentLines.push(
        { el: cell, o: "H", pos: r.top - 1, a: r.left, b: r.right },
        { el: cell, o: "H", pos: r.bottom, a: r.left, b: r.right },
        { el: cell, o: "V", pos: r.left - 1, a: r.top, b: r.bottom },
        { el: cell, o: "V", pos: r.right, a: r.top, b: r.bottom }
      );
    }
    for (const card of inset.querySelectorAll("[data-slot=shell-rail] [data-slot=card]")) {
      if (!visible(card)) continue;
      const r = card.getBoundingClientRect();
      contentLines.push(
        { el: card, o: "H", pos: r.top, a: r.left, b: r.right },
        { el: card, o: "H", pos: r.bottom - 1, a: r.left, b: r.right },
        { el: card, o: "V", pos: r.left, a: r.top, b: r.bottom },
        { el: card, o: "V", pos: r.right - 1, a: r.top, b: r.bottom }
      );
    }
    const seen = new Set();
    for (const s of shellLines) {
      for (const c of contentLines) {
        if (c.o !== s.o || !inside(c.o, c.pos)) continue;
        if (Math.abs(Math.round(c.pos) - Math.round(s.pos)) !== 1) continue;
        if (Math.min(c.b, s.b) - Math.max(c.a, s.a) <= 0) continue;
        if (seen.has(s.name)) continue;
        seen.add(s.name);
        issues.push(`edge-double   ${s.name} ${label(c.el)}`);
      }
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
