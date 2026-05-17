#!/usr/bin/env node
/**
 * blog 記事の <chart-placeholder ... /> を、隣接する Markdown table から
 * 抽出したデータで inline <svg> bar chart に置換する。
 *
 * Usage:
 *   node .claude/scripts/blog/gen-chart-svg.cjs <slug> [--dry-run]
 *   node .claude/scripts/blog/gen-chart-svg.cjs --all [--dry-run]
 */

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const BLOG_DIR = path.join(PROJECT_ROOT, ".local/r2/app/blog");

const CHART_RE = /<chart-placeholder\s+([^/>]*?)\s*\/>/g;
const ATTR_RE = /(\w+)="([^"]*)"/g;

function parseAttrs(attrStr) {
    const out = {};
    let m;
    ATTR_RE.lastIndex = 0;
    while ((m = ATTR_RE.exec(attrStr))) out[m[1]] = m[2];
    return out;
}

/**
 * Locate the markdown table closest to a given line index.
 * Looks backward first, then forward, within a window.
 */
function findNearestTable(lines, anchorIdx, window = 40) {
    const isTableRow = (s) => /^\s*\|.+\|\s*$/.test(s);
    const isSeparator = (s) => /^\s*\|[\s:|-]+\|\s*$/.test(s);

    // Search backward
    for (let i = anchorIdx - 1; i >= Math.max(0, anchorIdx - window); i--) {
        if (isTableRow(lines[i])) {
            const end = i;
            let start = i;
            while (start > 0 && isTableRow(lines[start - 1])) start--;
            if (end - start >= 2 && isSeparator(lines[start + 1])) {
                return { start, end };
            }
        }
    }
    // Search forward
    for (let i = anchorIdx + 1; i < Math.min(lines.length, anchorIdx + window); i++) {
        if (isTableRow(lines[i])) {
            const start = i;
            let end = i;
            while (end < lines.length - 1 && isTableRow(lines[end + 1])) end++;
            if (end - start >= 2 && isSeparator(lines[start + 1])) {
                return { start, end };
            }
        }
    }
    return null;
}

/**
 * Parse markdown table rows into { rank, label, value, raw }
 * Expects columns: 順位 | 都道府県 | 数値[+単位]
 */
function parseTable(lines, start, end) {
    const rows = [];
    for (let i = start + 2; i <= end; i++) {
        const cells = lines[i]
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim());
        if (cells.length < 3) continue;
        const rank = parseInt(cells[0].replace(/[^0-9]/g, ""), 10);
        const label = cells[1].replace(/\*\*/g, "");
        const rawValue = cells[2];
        // Extract numeric: handle 12,345 / 12,345.6 / 535g / 3,148.5
        const numStr = rawValue.replace(/[,\s]/g, "").match(/-?[\d.]+/);
        const value = numStr ? parseFloat(numStr[0]) : NaN;
        if (!Number.isFinite(value)) continue;
        if (!Number.isFinite(rank)) continue;
        rows.push({ rank, label, value, raw: rawValue });
    }
    // Keep only top 10 by rank if more rows present
    rows.sort((a, b) => a.rank - b.rank);
    return rows.slice(0, 10);
}

/**
 * Build inline SVG horizontal bar chart.
 */
function buildSvg(rows, caption) {
    if (rows.length === 0) return null;
    const maxValue = Math.max(...rows.map((r) => r.value));
    const barCount = rows.length;
    const barHeight = 22;
    const gap = 6;
    const labelWidth = 110;
    const valueWidth = 90;
    const barAreaWidth = 480;
    const innerHeight = barCount * (barHeight + gap) + 20;
    const totalWidth = labelWidth + barAreaWidth + valueWidth + 40;
    const totalHeight = innerHeight + (caption ? 40 : 20);

    const bars = rows
        .map((r, i) => {
            const y = i * (barHeight + gap) + 10;
            const w = Math.max(1, (r.value / maxValue) * barAreaWidth);
            const labelX = labelWidth - 6;
            const barX = labelWidth + 4;
            const valueX = barX + w + 6;
            const fill = i === 0 ? "#1d4ed8" : "#3b82f6";
            const safeLabel = r.label.replace(/[<>&]/g, "");
            const safeValue = r.raw.replace(/[<>&]/g, "");
            return (
                `<text x="${labelX}" y="${y + barHeight - 6}" text-anchor="end" font-size="13" fill="#475569">${r.rank}. ${safeLabel}</text>` +
                `<rect x="${barX}" y="${y}" width="${w.toFixed(1)}" height="${barHeight}" fill="${fill}" rx="2"/>` +
                `<text x="${valueX}" y="${y + barHeight - 6}" font-size="12" fill="#334155">${safeValue}</text>`
            );
        })
        .join("");

    const captionEl = caption
        ? `<text x="${totalWidth / 2}" y="${totalHeight - 10}" text-anchor="middle" font-size="11" fill="#64748b">${caption.replace(/[<>&]/g, "")}</text>`
        : "";

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" role="img" aria-label="${caption || "ranking chart"}">` +
        `<rect width="100%" height="100%" fill="#f8fafc" rx="6"/>` +
        bars +
        captionEl +
        `</svg>`
    );
}

function processArticle(slug, { dryRun = false } = {}) {
    const filePath = path.join(BLOG_DIR, slug, "article.md");
    if (!fs.existsSync(filePath)) return { slug, ok: false, reason: "no article.md" };

    const original = fs.readFileSync(filePath, "utf-8");
    const lines = original.split("\n");

    // Find all chart-placeholder positions
    const replacements = [];
    for (let i = 0; i < lines.length; i++) {
        const matches = [...lines[i].matchAll(CHART_RE)];
        for (const m of matches) {
            const attrs = parseAttrs(m[1]);
            const caption = attrs.caption || "";
            const tableRange = findNearestTable(lines, i);
            if (!tableRange) {
                replacements.push({ lineIdx: i, fullMatch: m[0], svg: null, reason: "no table" });
                continue;
            }
            const rows = parseTable(lines, tableRange.start, tableRange.end);
            if (rows.length === 0) {
                replacements.push({ lineIdx: i, fullMatch: m[0], svg: null, reason: "empty rows" });
                continue;
            }
            const svg = buildSvg(rows, caption);
            replacements.push({ lineIdx: i, fullMatch: m[0], svg, reason: "ok" });
        }
    }

    if (replacements.length === 0) {
        return { slug, ok: true, count: 0, skipped: 0 };
    }

    let updated = original;
    let count = 0;
    let skipped = 0;
    for (const r of replacements) {
        if (!r.svg) {
            skipped++;
            continue;
        }
        // Replace exactly once per occurrence
        const idx = updated.indexOf(r.fullMatch);
        if (idx === -1) continue;
        updated = updated.slice(0, idx) + r.svg + updated.slice(idx + r.fullMatch.length);
        count++;
    }

    if (!dryRun && updated !== original) {
        fs.writeFileSync(filePath, updated);
    }
    return { slug, ok: true, count, skipped, total: replacements.length };
}

function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");
    const all = args.includes("--all");

    let slugs;
    if (all) {
        slugs = fs
            .readdirSync(BLOG_DIR, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name);
    } else {
        slugs = args.filter((a) => !a.startsWith("--"));
        if (slugs.length === 0) {
            console.error("Usage: gen-chart-svg.cjs <slug> [<slug>...] | --all  [--dry-run]");
            process.exit(1);
        }
    }

    let totalCharts = 0;
    let totalSkipped = 0;
    let touched = 0;
    for (const slug of slugs) {
        const result = processArticle(slug, { dryRun });
        if (!result.ok) {
            console.log(`SKIP ${slug} — ${result.reason}`);
            continue;
        }
        if (result.count === 0 && result.skipped === 0) {
            continue;
        }
        console.log(
            `${dryRun ? "[dry]" : "[write]"} ${slug}: replaced=${result.count}/${result.total}${result.skipped ? ` skipped=${result.skipped}` : ""}`,
        );
        totalCharts += result.count;
        totalSkipped += result.skipped;
        if (result.count > 0) touched++;
    }
    console.log(`---`);
    console.log(`Articles touched: ${touched}`);
    console.log(`Charts replaced:  ${totalCharts}`);
    if (totalSkipped > 0) console.log(`Charts skipped:   ${totalSkipped}`);
}

main();
