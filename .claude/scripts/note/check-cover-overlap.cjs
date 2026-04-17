#!/usr/bin/env node
/**
 * Detect overlapping <text> elements in note article cover SVGs.
 *
 * SVG `<text y="...">` の y は baseline。CJK グリフは baseline から
 *   - 上に  font-size * 0.88 (em-box top)
 *   - 下に  font-size * 0.12 (descender)
 * 占有する。font-size 180 を y=250 に置くと top=92 となり、y=110 のリード文と重なる。
 *
 * Usage:
 *   node .claude/scripts/note/check-cover-overlap.cjs <svg-or-glob> [<svg-or-glob> ...]
 *   node .claude/scripts/note/check-cover-overlap.cjs 'docs/31_note記事原稿/*\/images/cover*.svg'
 *
 * Exit 0 if no overlaps. Exit 1 if any overlap found.
 */
const fs = require("fs");
const path = require("path");

// CJK glyph metrics (vertical occupancy relative to font-size around baseline).
const ASCENT_RATIO = 0.88;
const DESCENT_RATIO = 0.12;

// Horizontal width estimate per character. Conservative for CJK-mixed strings.
// Latin/digit/percent average ~0.55em, CJK ~1.0em. Use a mixed-aware estimator.
function estimateTextWidth(text, fontSize) {
  let units = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    // CJK Unified Ideographs / Hiragana / Katakana / Fullwidth / CJK Symbols
    if (
      (code >= 0x3040 && code <= 0x30ff) ||
      (code >= 0x3400 && code <= 0x9fff) ||
      (code >= 0xff00 && code <= 0xffef) ||
      (code >= 0x2e80 && code <= 0x303f)
    ) {
      units += 1.0;
    } else if (ch === " ") {
      units += 0.3;
    } else {
      // Latin digit/letter/punct
      units += 0.55;
    }
  }
  return units * fontSize;
}

// Walk the SVG tracking <g transform="translate(x,y)"> nesting.
// We do not handle scale/rotate/matrix — they are not used in our cover SVGs.
function parseTextElements(svg) {
  const tagRe = /<(\/?)(g|text)\b([^>]*?)(\/?)>/g;
  const out = [];
  const stack = []; // [{ dx, dy }]
  let cumDx = 0;
  let cumDy = 0;
  let m;
  let pos = 0;
  while ((m = tagRe.exec(svg)) !== null) {
    const closing = m[1] === "/";
    const name = m[2];
    const attrs = m[3];
    const selfClose = m[4] === "/";
    if (name === "g") {
      if (closing) {
        const f = stack.pop();
        if (f) {
          cumDx -= f.dx;
          cumDy -= f.dy;
        }
      } else {
        const t = parseTranslate(attr(attrs, "transform"));
        cumDx += t.dx;
        cumDy += t.dy;
        if (!selfClose) stack.push(t);
      }
    } else if (name === "text" && !closing) {
      // find matching </text>
      const closeIdx = svg.indexOf("</text>", tagRe.lastIndex);
      if (closeIdx < 0) continue;
      const inner = svg.slice(tagRe.lastIndex, closeIdx).replace(/<[^>]+>/g, "");
      const x = num(attrs, "x");
      const y = num(attrs, "y");
      const fontSize = num(attrs, "font-size");
      if (x != null && y != null && fontSize != null) {
        const text = inner.trim();
        if (text) {
          out.push({
            x: x + cumDx,
            y: y + cumDy,
            fontSize,
            anchor: attr(attrs, "text-anchor") || "start",
            text,
          });
        }
      }
      tagRe.lastIndex = closeIdx + "</text>".length;
    }
  }
  return out;
}

function parseTranslate(transform) {
  if (!transform) return { dx: 0, dy: 0 };
  const m = transform.match(/translate\(\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*|\s+)(-?\d+(?:\.\d+)?)\s*\)/);
  if (!m) return { dx: 0, dy: 0 };
  return { dx: parseFloat(m[1]), dy: parseFloat(m[2]) };
}

function attr(s, name) {
  const m = s.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? m[1] : null;
}
function num(s, name) {
  const v = attr(s, name);
  if (v == null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function bbox(t) {
  const w = estimateTextWidth(t.text, t.fontSize);
  let left;
  if (t.anchor === "middle") left = t.x - w / 2;
  else if (t.anchor === "end") left = t.x - w;
  else left = t.x;
  return {
    x1: left,
    x2: left + w,
    y1: t.y - t.fontSize * ASCENT_RATIO,
    y2: t.y + t.fontSize * DESCENT_RATIO,
  };
}

// Tolerance: ignore <=4px overlap (touching baselines / minor antialiasing).
const OVERLAP_TOLERANCE = 4;
function overlaps(a, b) {
  const xOverlap = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
  const yOverlap = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
  return xOverlap > OVERLAP_TOLERANCE && yOverlap > OVERLAP_TOLERANCE;
}

function checkFile(file) {
  const svg = fs.readFileSync(file, "utf8");
  const texts = parseTextElements(svg);
  const issues = [];
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const ba = bbox(texts[i]);
      const bb = bbox(texts[j]);
      if (overlaps(ba, bb)) {
        issues.push({ a: texts[i], b: texts[j], ba, bb });
      }
    }
  }
  return issues;
}

function expand(args) {
  const out = [];
  for (const a of args) {
    if (a.includes("*") || a.includes("?")) {
      // Use shell glob via fs.globSync (Node 22+) or manual walk.
      try {
        out.push(...fs.globSync(a));
      } catch {
        // Node < 22 fallback: warn
        console.error(
          "Glob expansion requires Node 22+. Pass explicit file paths.",
        );
        process.exit(2);
      }
    } else {
      out.push(a);
    }
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      "usage: node check-cover-overlap.cjs <svg> [<svg> ...]\n" +
        "       node check-cover-overlap.cjs 'docs/31_note記事原稿/*/images/cover*.svg'",
    );
    process.exit(2);
  }
  const files = expand(args);
  let totalIssues = 0;
  for (const f of files) {
    const issues = checkFile(f);
    if (issues.length === 0) {
      console.log(`OK   ${f}`);
      continue;
    }
    totalIssues += issues.length;
    console.log(`FAIL ${f} (${issues.length} overlap(s))`);
    for (const { a, b } of issues) {
      const trim = (s) => (s.length > 30 ? s.slice(0, 28) + "…" : s);
      console.log(
        `  - "${trim(a.text)}" (font=${a.fontSize} y=${a.y}) ↔ ` +
          `"${trim(b.text)}" (font=${b.fontSize} y=${b.y})`,
      );
    }
  }
  if (totalIssues > 0) {
    console.log(`\n${totalIssues} overlap(s) detected.`);
    process.exit(1);
  }
}

main();
