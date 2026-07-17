/**
 * buzz-map 同梱フォントのローダ
 *
 * public/buzz-map/fonts/ の woff2 を FontFace API で登録する。
 * レンダ環境（リモート Linux 等）に Noto Sans JP が無くても描画を一致させるための同梱
 * （@fontsource/noto-sans-jp の japanese+latin サブセット。数字は Archivo Bold サブセット）。
 */

import { useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

const FACES: Array<{
  family: string;
  file: string;
  weight: string;
  unicodeRange?: string;
}> = [
  { family: "BuzzMapSans", file: "noto-sans-jp-latin-400-normal.woff2", weight: "400" },
  { family: "BuzzMapSans", file: "noto-sans-jp-latin-700-normal.woff2", weight: "700" },
  { family: "BuzzMapSans", file: "noto-sans-jp-japanese-400-normal.woff2", weight: "400" },
  { family: "BuzzMapSans", file: "noto-sans-jp-japanese-700-normal.woff2", weight: "700" },
  // 数字 + 「年」「%」「.」「,」のみのサブセット（2.8KB）
  { family: "BuzzMapNum", file: "archivo-bold-num.woff2", weight: "700" },
];

let loaded: Promise<void> | null = null;

function loadFonts(): Promise<void> {
  if (!loaded) {
    loaded = Promise.all(
      FACES.map(async (f) => {
        const face = new FontFace(
          f.family,
          `url(${staticFile(`buzz-map/fonts/${f.file}`)}) format('woff2')`,
          { weight: f.weight, ...(f.unicodeRange ? { unicodeRange: f.unicodeRange } : {}) }
        );
        await face.load();
        document.fonts.add(face);
      })
    ).then(() => undefined);
  }
  return loaded;
}

export function useBuzzMapFonts(): boolean {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Loading buzz-map fonts"));

  useState(() => {
    loadFonts()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  });

  return ready;
}
