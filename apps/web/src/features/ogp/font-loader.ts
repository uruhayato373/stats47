// Old UA forces Google Fonts to return TTF (not WOFF2), which Satori supports
const UA_TTF = 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)';

// Valid OpenType/TrueType font signatures (first 4 bytes)
const VALID_FONT_SIGS = [
  0x00010000, // TrueType
  0x4f54544f, // 'OTTO' — CFF OpenType
  0x74746366, // 'ttcf' — TTC collection
  0x74727565, // 'true' — old Mac TrueType
];

type OgWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type OgFont = { data: ArrayBuffer; name: string; weight: OgWeight; style: 'normal' | 'italic' };

async function fetchFontData(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`,
    { headers: { 'User-Agent': UA_TTF } }
  ).then((r) => {
    if (!r.ok) throw new Error(`Google Fonts CSS fetch failed: ${r.status}`);
    return r.text();
  });
  const urlMatch = css.match(/src:\s*url\(([^)]+)\)/);
  if (!urlMatch) throw new Error(`Font URL not found for ${family}:${weight}`);
  const buffer = await fetch(urlMatch[1]).then((r) => r.arrayBuffer());
  // Validate OpenType signature to guard against non-font responses (e.g. CI network filtering)
  const sig = new DataView(buffer).getUint32(0, false);
  if (!VALID_FONT_SIGS.includes(sig)) throw new Error(`Invalid font signature for ${family}:${weight}`);
  return buffer;
}

// Module-scope memoization. These are build/runtime font *assets* (not R2 page data),
// so caching the fetched Promise across calls within a warm isolate is acceptable and
// avoids re-fetching ~MB of Google Fonts on every OGP image render.
// On failure we reset the cache so a later call can retry instead of permanently caching [].
let fontsPromise: Promise<OgFont[]> | null = null;

async function loadOgpFontsUncached(): Promise<OgFont[]> {
  try {
    const [regular, bold, black] = await Promise.all([
      fetchFontData('Noto Sans JP', 400),
      fetchFontData('Noto Sans JP', 700),
      fetchFontData('Noto Sans JP', 900),
    ]);
    return [
      { name: 'Noto Sans JP', data: regular, weight: 400, style: 'normal' },
      { name: 'Noto Sans JP', data: bold, weight: 700, style: 'normal' },
      { name: 'Noto Sans JP', data: black, weight: 900, style: 'normal' },
    ];
  } catch {
    // Font loading failure → Satori will use fallback (Latin only)
    return [];
  }
}

export async function loadOgpFonts(): Promise<OgFont[]> {
  if (fontsPromise) return fontsPromise;
  const promise = loadOgpFontsUncached();
  fontsPromise = promise;
  // Don't permanently cache a failed (empty) result — allow a retry on the next call.
  const fonts = await promise;
  if (fonts.length === 0) fontsPromise = null;
  return fonts;
}
