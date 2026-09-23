import AxeBuilder from "@axe-core/playwright";
import type { Page } from "playwright";

import type { MetricValue } from "../types";

export const MAX_UI_FINDINGS = 10;

export interface LayoutIssues {
  clipped: string[];
  overlaps: string[];
}

/**
 * ページ内で実行するレイアウト検査。page.evaluate に渡すため外側の変数を参照しない。
 * - clipped: overflow を hidden/clip にした要素で、中の文字が枠からはみ出して切れているもの
 *   (text-overflow: ellipsis と line-clamp は意図した省略なので除外)
 * - overlaps: タップできる要素どうしが、小さい方の面積の 25% 以上重なっているもの (入れ子は除外)
 */
export function collectLayoutIssues(): LayoutIssues {
  const describe = (el: Element): string => {
    let label = el.tagName.toLowerCase();
    const cls = (el.getAttribute("class") ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 3).join(".");
    if (cls) label += `.${cls}`;
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    return text ? `${label} "${text}"` : label;
  };
  const isVisible = (el: Element): boolean => {
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    return rect.right > 0 && rect.left < document.documentElement.clientWidth;
  };
  // 閉じた <details> の中身は描画されないのにレイアウト上の位置を持つ (Chrome の content-visibility)。
  const inClosedDetails = (el: Element): boolean => {
    const details = el.closest("details:not([open])");
    if (!details) return false;
    const summary = details.querySelector(":scope > summary");
    return !(summary && summary.contains(el));
  };
  const excluded = (el: Element): boolean =>
    el.closest('[aria-hidden="true"], .sr-only, [hidden]') !== null || inClosedDetails(el);

  // 枠の外へ出ている文字があるか。地図タイルのように文字以外がはみ出す要素を誤検知しない。
  const textOverflows = (el: Element): boolean => {
    const box = el.getBoundingClientRect();
    const left = box.left + el.clientLeft;
    const top = box.top + el.clientTop;
    const right = left + el.clientWidth;
    const bottom = top + el.clientHeight;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if ((node.textContent ?? "").trim() === "") continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of Array.from(range.getClientRects())) {
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > right + 2 || r.bottom > bottom + 2 || r.left < left - 2 || r.top < top - 2) return true;
      }
    }
    return false;
  };

  const clipped: string[] = [];
  for (const el of Array.from(document.body.querySelectorAll("*"))) {
    const style = getComputedStyle(el);
    const hidesX = style.overflowX === "hidden" || style.overflowX === "clip";
    const hidesY = style.overflowY === "hidden" || style.overflowY === "clip";
    if (!hidesX && !hidesY) continue;
    if (style.textOverflow === "ellipsis") continue;
    const lineClamp = style.getPropertyValue("-webkit-line-clamp");
    if (lineClamp && lineClamp !== "none") continue;
    if ((el.textContent ?? "").trim() === "") continue;
    if (excluded(el) || !isVisible(el)) continue;
    const overX = hidesX && el.scrollWidth > el.clientWidth + 2;
    const overY = hidesY && el.scrollHeight > el.clientHeight + 2;
    if ((overX || overY) && textOverflows(el)) clipped.push(describe(el));
  }

  // 画面に固定表示される要素 (同意バナー・追従ヘッダー) は本文に重なるのが仕様なので除外する。
  const isPinned = (el: Element): boolean => {
    for (let node: Element | null = el; node; node = node.parentElement) {
      const position = getComputedStyle(node).position;
      if (position === "fixed" || position === "sticky") return true;
    }
    return false;
  };
  // 親の overflow で切り取られた後に実際に見えている範囲。折りたたまれたメニュー内のリンクは空になる。
  type Box = { left: number; top: number; right: number; bottom: number };
  const clipToAncestors = (el: Element, r: DOMRect): Box | null => {
    let left = r.left;
    let top = r.top;
    let right = r.right;
    let bottom = r.bottom;
    for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.overflowX === "visible" && style.overflowY === "visible") continue;
      const p = node.getBoundingClientRect();
      if (style.overflowX !== "visible") {
        left = Math.max(left, p.left);
        right = Math.min(right, p.right);
      }
      if (style.overflowY !== "visible") {
        top = Math.max(top, p.top);
        bottom = Math.min(bottom, p.bottom);
      }
      if (right - left <= 0 || bottom - top <= 0) return null;
    }
    return { left, top, right, bottom };
  };
  // 折り返したインラインのリンクは外接矩形が2行分に広がるので、行ごとの矩形で比べる。
  const visibleBoxes = (el: Element): Box[] =>
    Array.from(el.getClientRects())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => clipToAncestors(el, r))
      .filter((b): b is Box => b !== null);
  const area = (b: Box) => (b.right - b.left) * (b.bottom - b.top);
  const overlapsEnough = (a: Box, b: Box): boolean => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0 && h > 0 && w * h >= Math.min(area(a), area(b)) * 0.25;
  };

  const candidates = Array.from(
    document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]')
  ).filter((el) => !excluded(el) && isVisible(el) && !isPinned(el));
  const targets: Element[] = [];
  const boxes: Box[][] = [];
  for (const el of candidates) {
    const list = visibleBoxes(el);
    if (list.length === 0) continue;
    targets.push(el);
    boxes.push(list);
  }
  const overlaps: string[] = [];
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const a = targets[i];
      const b = targets[j];
      if (a.contains(b) || b.contains(a)) continue;
      if (boxes[i].some((ba) => boxes[j].some((bb) => overlapsEnough(ba, bb)))) {
        overlaps.push(`${describe(a)} ⇄ ${describe(b)}`);
      }
    }
  }

  return { clipped, overlaps };
}

/**
 * tsx (esbuild keepNames) は関数本体に `__name(...)` を差し込むため、page.evaluate へ関数をそのまま
 * 渡すとブラウザ側で ReferenceError になる。文字列化し、同名の恒等関数を定義してから評価する。
 */
export function evaluateLayoutIssues(page: Page): Promise<LayoutIssues> {
  return page.evaluate(
    `(() => { const __name = (fn) => fn; return (${collectLayoutIssues.toString()})(); })()`
  ) as Promise<LayoutIssues>;
}

export interface UiProbeResult {
  clipped_text: MetricValue;
  overlapping_tap_targets: MetricValue;
  a11y_violations: MetricValue;
  ui_findings: string[];
}

const IMPACTS_COUNTED = new Set(["critical", "serious"]);

export async function probeUi(page: Page): Promise<UiProbeResult> {
  const findings: string[] = [];
  // CSS・Web フォントの適用前に測ると、非表示のはずの要素 (PC 用サイドバー等) が見えている扱いになる。
  await page.waitForLoadState("load").catch(() => undefined);
  await page.evaluate("document.fonts.ready.then(() => true)").catch(() => undefined);
  let clipped: MetricValue;
  let overlapping: MetricValue;
  try {
    const layout = await evaluateLayoutIssues(page);
    clipped = layout.clipped.length;
    overlapping = layout.overlaps.length;
    findings.push(...layout.clipped.slice(0, MAX_UI_FINDINGS).map((d) => `clipped_text: ${d}`));
    findings.push(...layout.overlaps.slice(0, MAX_UI_FINDINGS).map((d) => `overlapping_tap_target: ${d}`));
  } catch (e) {
    const reason = `layout probe failed: ${(e as Error).message}`;
    clipped = { value: null, reason };
    overlapping = { value: null, reason };
  }

  let a11y: MetricValue;
  try {
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const counted = result.violations.filter((v) => IMPACTS_COUNTED.has(v.impact ?? ""));
    a11y = counted.length;
    findings.push(
      ...counted.slice(0, MAX_UI_FINDINGS).map((v) => `a11y: ${v.id} (${v.impact}, ${v.nodes.length} 箇所)`)
    );
  } catch (e) {
    a11y = { value: null, reason: `axe failed: ${(e as Error).message}` };
  }

  return { clipped_text: clipped, overlapping_tap_targets: overlapping, a11y_violations: a11y, ui_findings: findings };
}
