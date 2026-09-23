/**
 * IG シリーズ共通フォントのローダ（Google Fonts CSS を render 時に取得）
 *
 * buzz-map (`useBuzzMapFonts.ts`) は自己ホストの woff2 を FontFace API で登録するが、
 * ig-series は依存追加・フォントファイルのリポジトリ同梱をせず、承認済みモック
 * (`mock.html` の `<link href="https://fonts.googleapis.com/css2?family=...">`) と同じ
 * Google Fonts CSS を render 時に取得して使う。
 *
 * 読み込みは `document.fonts.check()` で実際にフォントが使えるかまで検証し、
 * 1 つでも欠けていれば `cancelRender` で render を失敗させる（黙って fallback フォントで
 * 描画を続けない。見出しが M PLUS 1p ではなく別書体で焼かれた静止画を作らないため）。
 */

import { useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";

const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=M+PLUS+1p:wght@900&family=Archivo+Black&family=Noto+Sans+JP:wght@700;900&display=swap";

/**
 * `document.fonts.load()` / `document.fonts.check()` に渡すフォント指定。
 * ウェイトごとに実在を検証する（Noto Sans JP は 700/900 の両方を要求）。
 */
const REQUIRED_FONT_SPECS = [
  "900 40px 'M PLUS 1p'",
  "400 40px 'Archivo Black'",
  "700 40px 'Noto Sans JP'",
  "900 40px 'Noto Sans JP'",
] as const;

function injectGoogleFontsStylesheet(href: string): Promise<void> {
  const existing = document.querySelector<HTMLLinkElement>(`link[data-ig-series-fonts="1"]`);
  if (existing) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.igSeriesFonts = "1";
    link.onload = () => resolve();
    link.onerror = () =>
      reject(new Error(`ig-series: Google Fonts CSS の取得に失敗しました (${href})`));
    document.head.appendChild(link);
  });
}

async function loadIgSeriesFonts(): Promise<void> {
  await injectGoogleFontsStylesheet(GOOGLE_FONTS_HREF);
  // @font-face 宣言が届いた後、実グリフの取得を明示的に要求する
  await Promise.all(REQUIRED_FONT_SPECS.map((spec) => document.fonts.load(spec)));
  await document.fonts.ready;

  const missing = REQUIRED_FONT_SPECS.filter((spec) => !document.fonts.check(spec));
  if (missing.length > 0) {
    throw new Error(
      `ig-series: 次のフォントが読み込めませんでした（フォールバック書体での描画を許可しない）: ${missing.join(", ")}`,
    );
  }
}

let loadedOnce: Promise<void> | null = null;

function loadIgSeriesFontsOnce(): Promise<void> {
  if (!loadedOnce) {
    loadedOnce = loadIgSeriesFonts();
  }
  return loadedOnce;
}

/** IG シリーズの見出し/数値/本文フォントを読み込む。読み込み失敗時は render を失敗させる */
export function useIgSeriesFonts(): boolean {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Loading ig-series fonts (Google Fonts)"));

  useState(() => {
    loadIgSeriesFontsOnce()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  });

  return ready;
}
