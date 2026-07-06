#!/usr/bin/env node
/**
 * アフィリエイトバナー画像を fetch して「フォーマット・実寸・canonical 判定」を返し、
 * 目視用に画像ファイルを保存する。register-affiliate-banner の登録前検証に使う。
 *
 * 背景: A8.net は HTML に width/height を明記するが、ValueCommerce (gifbanner) や
 * 楽天アフィリエイト (pict) は **サイズがコードに出ない**。また広告主もコードからは不明。
 * → 画像を実際に取得して寸法を確定し、保存ファイルを Read で目視して広告主を判別する。
 *
 * 使い方:
 *   node .claude/scripts/ads/inspect-banner.mjs "<画像URL>" [保存先パス]
 *   - <画像URL>: A8 の bgt / ValueCommerce の gifbanner / 楽天の hsb 等 (protocol-relative // も可)
 *   - 保存先: 省略時は /tmp/claude-* scratchpad か /tmp/banner-inspect.<ext>
 *
 * 出力 (stdout, JSON 1 行): { format, width, height, canonical, canonicalSize, savedTo }
 * → savedTo を Read tool で開けば広告主を目視判別できる。
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const CANONICAL = new Set(["300x250", "250x250", "320x100"]);
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

function usage(msg) {
  process.stderr.write(`${msg}\n使い方: node .claude/scripts/ads/inspect-banner.mjs "<画像URL>" [保存先]\n`);
  process.exit(2);
}

/** PNG / GIF / JPEG のヘッダから [format, width, height] を返す (依存なし)。 */
function dimensions(buf) {
  // PNG: 8B signature → IHDR(len4+"IHDR") → width(4 BE) @16, height(4 BE) @20
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return ["png", buf.readUInt32BE(16), buf.readUInt32BE(20)];
  }
  // GIF: "GIF8" → width(2 LE) @6, height(2 LE) @8
  if (buf.length > 10 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return ["gif", buf.readUInt16LE(6), buf.readUInt16LE(8)];
  }
  // JPEG: FFD8 → SOF マーカー (FFC0-CF, ただし C4/C8/CC 除く) を走査 → height(2 BE), width(2 BE)
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2;
    while (o + 9 < buf.length) {
      if (buf[o] !== 0xff) { o++; continue; }
      const marker = buf[o + 1];
      const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSOF) {
        const height = buf.readUInt16BE(o + 5);
        const width = buf.readUInt16BE(o + 7);
        return ["jpeg", width, height];
      }
      const segLen = buf.readUInt16BE(o + 2);
      o += 2 + segLen;
    }
    return ["jpeg", 0, 0];
  }
  return ["unknown", 0, 0];
}

function main() {
  const url = process.argv[2];
  if (!url) usage("画像URLが必要です。");
  const normalized = url.startsWith("//") ? `https:${url}` : url;

  const outArg = process.argv[3];
  const tmpRaw = "/tmp/banner-inspect.raw";
  execFileSync("curl", ["-sL", "-A", UA, normalized, "-o", tmpRaw], { stdio: ["ignore", "ignore", "inherit"] });

  const buf = readFileSync(tmpRaw);
  if (buf.length === 0) usage("画像が取得できませんでした (0 バイト)。URL を確認してください。");

  const [format, width, height] = dimensions(buf);
  const size = `${width}x${height}`;
  // 高解像度 (2x) 素材は実寸の 1/2 が表示サイズ (例: GIF 600x500 → 表示 300x250)
  const halfSize = width % 2 === 0 && height % 2 === 0 ? `${width / 2}x${height / 2}` : null;
  const canonical = CANONICAL.has(size) || (halfSize !== null && CANONICAL.has(halfSize));
  const canonicalSize = CANONICAL.has(size) ? size : halfSize && CANONICAL.has(halfSize) ? halfSize : null;

  const ext = format === "unknown" ? "img" : format === "jpeg" ? "jpg" : format;
  const savedTo = outArg || `/tmp/banner-inspect.${ext}`;
  writeFileSync(savedTo, buf);

  process.stdout.write(
    JSON.stringify({ format, width, height, canonical, canonicalSize, savedTo }, null, 2) + "\n",
  );
  process.stderr.write(
    `\n[inspect] ${format} ${size}${halfSize ? ` (2x → 表示 ${halfSize})` : ""} / canonical=${canonical}\n` +
    `[inspect] 目視で広告主を判別するには Read tool で ${savedTo} を開く\n`,
  );
}

main();
