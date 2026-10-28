#!/usr/bin/env node
/**
 * tokens.css (テンプレートの oklch 値) から tokens-hsl.css (同じ色の HSL 3 値) を生成する。
 *
 * apps/web は色を `hsl(var(--primary))` の形で参照しており (tailwind.config.ts・globals.css・TS)、
 * oklch の値をそのまま入れると壊れる。値だけをテンプレートと同じ色にするため、ここで変換する。
 * tokens.css を変えたら `node packages/ui-theme/build-hsl-tokens.mjs` を実行する。
 * `--check` は生成結果と tokens-hsl.css の一致を確かめる (CI・テストが使う)。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const SRC = join(DIR, "tokens.css");
const OUT = join(DIR, "tokens-hsl.css");

/** oklch → sRGB (0..1)。https://bottosson.github.io/posts/oklab/ の行列 */
function oklchToSrgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((x) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.min(1, Math.max(0, v));
  });
}

function srgbToHsl([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

const round = (x, digits) => Number(x.toFixed(digits));

const OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/;

/**
 * `oklch(L C H)` → `H S% L%`。透過色 `oklch(L C H / A%)` は HSL 3 値で表せないので、
 * 同じブロックの --background に重ねた結果の不透明色にする (dark の線 = 白 10% が該当)。
 */
function convert(value, background) {
  const m = value.match(OKLCH);
  if (!m) return null;
  const [, L, C, H, alphaRaw, pct] = m;
  let rgb = oklchToSrgb(Number(L), Number(C), Number(H));
  if (alphaRaw) {
    if (!background) throw new Error(`透過色 ${value} を重ねる --background が無い`);
    const alpha = Number(alphaRaw) / (pct ? 100 : 1);
    rgb = rgb.map((c, i) => c * alpha + background[i] * (1 - alpha));
  }
  const [h, s, l] = srgbToHsl(rgb);
  return `${round(h, 1)} ${round(s * 100, 1)}% ${round(l * 100, 1)}%`;
}

export function buildHslTokens(css) {
  const blocks = [];
  for (const selector of [":root", ".dark"]) {
    const re = new RegExp(`(?:^|\\n)${selector.replace(".", "\\.")} \\{([\\s\\S]*?)\\n\\}`);
    const body = css.match(re)?.[1];
    if (!body) throw new Error(`${selector} が tokens.css に無い`);
    const bgRaw = body.match(/--background:\s*([^;]+);/)?.[1]?.trim();
    const bgMatch = bgRaw?.match(OKLCH);
    const background = bgMatch ? oklchToSrgb(Number(bgMatch[1]), Number(bgMatch[2]), Number(bgMatch[3])) : null;
    const lines = [];
    for (const [, name, raw] of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
      const value = raw.trim();
      const hsl = convert(value, background);
      const note = value.includes("/") ? ` /* ${value} を --background に重ねた色 */` : "";
      lines.push(`  --${name}: ${hsl ?? value};${note}`);
    }
    blocks.push(`${selector} {\n${lines.join("\n")}\n}`);
  }
  return `/* 生成物: packages/ui-theme/build-hsl-tokens.mjs が tokens.css (テンプレートの oklch 値) から作る。手で直さない。\n   apps/web の hsl(var(--x)) 参照のために、同じ色を HSL 3 値で持つ。 */\n\n${blocks.join("\n\n")}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const next = buildHslTokens(readFileSync(SRC, "utf8"));
  if (process.argv.includes("--check")) {
    const current = readFileSync(OUT, "utf8");
    if (current !== next) {
      console.error("✗ tokens-hsl.css が tokens.css と食い違っています。node packages/ui-theme/build-hsl-tokens.mjs で作り直してください");
      process.exit(1);
    }
    console.log("✓ tokens-hsl.css は tokens.css と一致");
  } else {
    writeFileSync(OUT, next);
    console.log(`✓ ${OUT} を生成`);
  }
}
