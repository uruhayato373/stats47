import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import type { ReactNode } from 'react';

import satori from 'satori';
import sharp from 'sharp';

export type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: 'normal' | 'italic';
};

const moduleRequire = createRequire(import.meta.url);

export function loadFonts(projectRoot: string): SatoriFont[] {
  const base = dirname(
    moduleRequire.resolve('@expo-google-fonts/noto-sans-jp', {
      paths: [projectRoot],
    })
  );
  return [
    {
      name: 'Noto Sans JP',
      data: readFileSync(join(base, '400Regular/NotoSansJP_400Regular.ttf'))
        .buffer as ArrayBuffer,
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Noto Sans JP',
      data: readFileSync(join(base, '700Bold/NotoSansJP_700Bold.ttf'))
        .buffer as ArrayBuffer,
      weight: 700,
      style: 'normal',
    },
    {
      name: 'Noto Sans JP',
      data: readFileSync(join(base, '900Black/NotoSansJP_900Black.ttf'))
        .buffer as ArrayBuffer,
      weight: 900,
      style: 'normal',
    },
  ];
}

export interface RenderSize {
  width: number;
  height: number;
}

const DEFAULT_SIZE: RenderSize = { width: 1200, height: 630 };

export async function renderToWebP(
  element: ReactNode,
  fonts: SatoriFont[],
  outputPath: string,
  size: RenderSize = DEFAULT_SIZE
): Promise<void> {
  const svg = await satori(element, { ...size, fonts });
  await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(outputPath);
}

export async function renderToPng(
  element: ReactNode,
  fonts: SatoriFont[],
  outputPath: string,
  size: RenderSize = DEFAULT_SIZE
): Promise<void> {
  const svg = await satori(element, { ...size, fonts });
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
}
