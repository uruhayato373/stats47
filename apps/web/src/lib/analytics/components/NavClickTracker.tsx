"use client";

import { useEffect } from "react";

import { trackAutoNavClick, wasNavClickSentSince } from "@/lib/analytics/events";

/**
 * サイト内リンクのクリックを 1 か所で拾い、nav_click として送る (NAV-CLICK-COVERAGE-01)。
 *
 * 2026-08-23〜09-19 の 28 日でサイト内のページ移動 11,319 件に対し、部品ごとに記録されたクリックは約 2 割しかなかった。
 * 計測を部品ごとの手動追加に頼っていたためで、既定を「全部送る」に反転する。
 *
 * - 導線名は外側の `data-nav-surface`、ラベルは `data-nav-label` (無ければ行き先のページ種別) から取る。導線名が無ければ `unlabeled`
 * - 部品側がすでに trackNavClick を送ったクリックは送らない (送信を 1 tick 遅らせて部品側の記録を確かめる)
 * - `data-click-owner` の中 (rail_click・cta_click など専用イベントで数える領域) と外部リンクは送らない
 * - クリックは止めない (preventDefault / stopPropagation を呼ばない)
 */
export function NavClickTracker(): null {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const at = performance.now();
      const target = event.target instanceof Element ? event.target : null;
      const resolved = resolveNavClick(target, window.location);
      if (!resolved) return;
      window.setTimeout(() => {
        if (wasNavClickSentSince(resolved.href, at)) return;
        trackAutoNavClick(resolved);
      }, 0);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}

export interface ResolvedNavClick {
  label: string;
  href: string;
  surface: string;
}

/** クリックされた要素から、送るべき nav_click を決める。送らないなら null */
export function resolveNavClick(
  target: Element | null,
  location: Pick<Location, "href" | "origin" | "pathname">,
): ResolvedNavClick | null {
  const anchor = target?.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.closest("[data-click-owner]")) return null;

  let url: URL;
  try {
    // 相対の href (#見出し・?pref=) は今のページを基準に解釈する
    url = new URL(anchor.getAttribute("href") ?? "", location.href);
  } catch {
    return null;
  }
  if (url.origin !== location.origin) return null;

  const surface = anchor.closest<HTMLElement>("[data-nav-surface]")?.dataset.navSurface;
  // 同じページ内の移動 (#見出し) は、目次のように導線名が付いているものだけ数える
  if (url.pathname === location.pathname && url.hash && !surface) return null;

  // GA4 で読めるよう、日本語の見出しやパスは文字コードのままにしない
  const href = safeDecode(`${url.pathname}${url.search}${url.hash}`);
  const label =
    anchor.closest<HTMLElement>("[data-nav-label]")?.dataset.navLabel ??
    pageTypeOf(url.pathname);
  return { label, href, surface: surface ?? "unlabeled" };
}

/** 行き先のページ種別 (パスの 1 段目)。トップは "home" */
function pageTypeOf(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] ?? "home";
}

function safeDecode(value: string): string {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}
