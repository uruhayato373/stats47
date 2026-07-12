#!/usr/bin/env node
"use strict";

/**
 * manifest / root metadata が参照するローカルアイコンの決定的ガード。
 *
 * 検査:
 * - `/...` で宣言された icon/apple asset が public/ に存在
 * - PNG の宣言 sizes と IHDR 実寸が一致
 * - 宣言 MIME と拡張子が一致
 * - SVG が viewBox を持ち、script / foreignObject / 外部 URL を含まない
 * - favicon.ico が 16/32/48 px を含む
 * - PWA に 192/512 px の any と maskable がそれぞれある
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const WEB_ROOT = path.join(ROOT, "apps/web");
const PUBLIC_ROOT = path.join(WEB_ROOT, "public");
const MANIFEST_PATH = path.join(WEB_ROOT, "src/app/manifest.ts");
const METADATA_PATH = path.join(WEB_ROOT, "src/lib/metadata/root-metadata.ts");
const hasJson = process.argv.includes("--json");

const MIME_BY_EXT = new Map([
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".ico", "image/x-icon"],
]);

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function parseIconObjects(source) {
  const objects = source.match(/\{[^{}]*\}/gs) || [];
  const icons = [];
  for (const object of objects) {
    const url = object.match(/(?:src|url):\s*["'](\/[^"']+)["']/)?.[1];
    if (!url || !/\.(?:svg|png|ico)$/i.test(url)) continue;
    icons.push({
      url,
      sizes: object.match(/sizes:\s*["']([^"']+)["']/)?.[1] ?? null,
      type: object.match(/type:\s*["']([^"']+)["']/)?.[1] ?? null,
      purpose: object.match(/purpose:\s*["']([^"']+)["']/)?.[1] ?? null,
    });
  }
  return icons;
}

function pngSize(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function icoSizes(buffer) {
  if (buffer.length < 6 || buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 1) {
    return null;
  }
  const count = buffer.readUInt16LE(4);
  if (buffer.length < 6 + count * 16) return null;
  const sizes = [];
  for (let i = 0; i < count; i++) {
    const offset = 6 + i * 16;
    sizes.push({
      width: buffer[offset] || 256,
      height: buffer[offset + 1] || 256,
    });
  }
  return sizes;
}

function declaredSquareSize(sizes) {
  const match = sizes?.match(/^(\d+)x(\d+)$/);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

function inspectSvg(file, findings) {
  const source = read(file);
  if (!/<svg\b/i.test(source) || !/\bviewBox\s*=\s*["'][^"']+["']/i.test(source)) {
    findings.push({ code: "SVG_VIEWBOX", file: rel(file), message: "SVG に viewBox がない" });
  }
  if (/<(?:script|foreignObject)\b/i.test(source)) {
    findings.push({ code: "SVG_ACTIVE_CONTENT", file: rel(file), message: "SVG に active content がある" });
  }
  if (/\b(?:href|xlink:href)\s*=\s*["'](?:https?:)?\/\//i.test(source)) {
    findings.push({ code: "SVG_EXTERNAL_URL", file: rel(file), message: "SVG に外部 URL 参照がある" });
  }
}

function validateIcon(icon, sourceFile, findings) {
  const publicPath = decodeURIComponent(icon.url.split(/[?#]/)[0]);
  const file = path.join(PUBLIC_ROOT, publicPath.replace(/^\//, ""));
  if (!file.startsWith(`${PUBLIC_ROOT}${path.sep}`)) {
    findings.push({ code: "PATH_ESCAPE", file: rel(sourceFile), message: `${icon.url} が public/ 外を指す` });
    return;
  }
  if (!fs.existsSync(file)) {
    findings.push({ code: "MISSING", file: rel(sourceFile), message: `${icon.url} が存在しない` });
    return;
  }

  const ext = path.extname(file).toLowerCase();
  const expectedMime = MIME_BY_EXT.get(ext);
  if (icon.type && expectedMime && icon.type !== expectedMime) {
    findings.push({
      code: "MIME_MISMATCH",
      file: rel(sourceFile),
      message: `${icon.url}: type=${icon.type}, expected=${expectedMime}`,
    });
  }

  if (ext === ".svg") inspectSvg(file, findings);
  if (ext === ".png") {
    const actual = pngSize(fs.readFileSync(file));
    if (!actual) {
      findings.push({ code: "INVALID_PNG", file: rel(file), message: "PNG signature/IHDR が不正" });
      return;
    }
    const declared = declaredSquareSize(icon.sizes);
    if (declared && (actual.width !== declared.width || actual.height !== declared.height)) {
      findings.push({
        code: "SIZE_MISMATCH",
        file: rel(file),
        message: `declared=${declared.width}x${declared.height}, actual=${actual.width}x${actual.height}`,
      });
    }
  }
}

function main() {
  const findings = [];
  const manifestIcons = parseIconObjects(read(MANIFEST_PATH));
  const metadataIcons = parseIconObjects(read(METADATA_PATH));
  for (const icon of manifestIcons) validateIcon(icon, MANIFEST_PATH, findings);
  for (const icon of metadataIcons) validateIcon(icon, METADATA_PATH, findings);

  const icoPath = path.join(PUBLIC_ROOT, "favicon.ico");
  if (!fs.existsSync(icoPath)) {
    findings.push({ code: "MISSING_ICO", file: rel(icoPath), message: "favicon.ico がない" });
  } else {
    const sizes = icoSizes(fs.readFileSync(icoPath));
    if (!sizes) {
      findings.push({ code: "INVALID_ICO", file: rel(icoPath), message: "ICO directory が不正" });
    } else {
      for (const required of [16, 32, 48]) {
        if (!sizes.some((size) => size.width === required && size.height === required)) {
          findings.push({ code: "ICO_SIZE", file: rel(icoPath), message: `${required}x${required} がない` });
        }
      }
    }
  }

  for (const purpose of ["any", "maskable"]) {
    for (const size of [192, 512]) {
      const declared = manifestIcons.some(
        (icon) => icon.purpose === purpose && icon.sizes === `${size}x${size}`,
      );
      if (!declared) {
        findings.push({
          code: "PWA_ICON_SET",
          file: rel(MANIFEST_PATH),
          message: `purpose=${purpose} ${size}x${size} がない`,
        });
      }
    }
  }

  const output = {
    checked: manifestIcons.length + metadataIcons.length,
    manifestIcons: manifestIcons.length,
    metadataIcons: metadataIcons.length,
    findings,
  };
  if (hasJson) console.log(JSON.stringify(output, null, 2));
  else if (findings.length === 0) {
    console.log(`✓ static asset contract OK — ${output.checked} declarations`);
  } else {
    console.error(`✗ static asset contract: ${findings.length} findings`);
    for (const finding of findings) {
      console.error(`  [${finding.code}] ${finding.file}: ${finding.message}`);
    }
  }
  process.exit(findings.length === 0 ? 0 : 1);
}

main();
