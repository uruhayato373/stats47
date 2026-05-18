#!/usr/bin/env node
/**
 * PSI CWV alert → candidate component suggestion CLI
 *
 * Usage:
 *   node .claude/scripts/psi/suggest-cwv-candidates.mjs \
 *     --url https://stats47.jp/ranking/area-population \
 *     [--url <url2> ...] [--format markdown|json] [--max N]
 *
 * 出力: 候補ファイル一覧 (git blame 付き) + 過去施策ポインタ
 * scope: candidate suggestion のみ。PR 起票 / LLM 改修案生成 / workflow 改修は含まない。
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

// -------- arg parse --------
const args = process.argv.slice(2);
const urls = [];
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--url" && args[i + 1]) urls.push(args[i + 1]);
}
const FORMAT = getArg("--format") || "markdown";
const MAX = Number(getArg("--max") || 5);

if (urls.length === 0) {
  console.error(
    "Usage: --url <url> [--url <url> ...] [--format markdown|json] [--max N]"
  );
  process.exit(1);
}

// -------- URL → feature/route 候補マッピング --------
// 実在する apps/web/src/features と apps/web/src/app に基づく
function urlToCandidateRoots(url) {
  let pathname;
  try {
    pathname = new URL(url, "https://stats47.jp").pathname;
  } catch {
    pathname = url.startsWith("/") ? url : `/${url}`;
  }

  // top
  if (pathname === "/" || pathname === "") {
    return {
      pathname,
      roots: ["apps/web/src/app/page.tsx"],
      featureDirs: [],
    };
  }
  // /ranking/[key]
  if (pathname.startsWith("/ranking/") || pathname === "/ranking") {
    return {
      pathname,
      roots: ["apps/web/src/app/ranking"],
      featureDirs: ["apps/web/src/features/ranking"],
    };
  }
  // /areas/[code]
  if (pathname.startsWith("/areas/") || pathname === "/areas") {
    return {
      pathname,
      roots: ["apps/web/src/app/areas"],
      featureDirs: [
        "apps/web/src/features/area-profile",
        "apps/web/src/features/area",
      ],
    };
  }
  // /search
  if (pathname.startsWith("/search")) {
    return {
      pathname,
      roots: ["apps/web/src/app/search"],
      featureDirs: ["apps/web/src/features/search"],
    };
  }
  // /blog/[slug]
  if (pathname.startsWith("/blog/") || pathname === "/blog") {
    return {
      pathname,
      roots: ["apps/web/src/app/blog"],
      featureDirs: ["apps/web/src/features/blog"],
    };
  }
  // /compare/[key]
  if (pathname.startsWith("/compare/") || pathname === "/compare") {
    return {
      pathname,
      roots: ["apps/web/src/app/compare"],
      featureDirs: [
        "apps/web/src/features/category",
        "apps/web/src/features/category-compare",
      ],
    };
  }
  // /category/[key]
  if (pathname.startsWith("/category/") || pathname === "/category") {
    return {
      pathname,
      roots: ["apps/web/src/app/category"],
      featureDirs: ["apps/web/src/features/category"],
    };
  }
  // /survey, /survey/[key]
  if (pathname.startsWith("/survey")) {
    return {
      pathname,
      roots: ["apps/web/src/app/survey"],
      featureDirs: ["apps/web/src/features/survey"],
    };
  }
  // /themes/[key]
  if (pathname.startsWith("/themes")) {
    return {
      pathname,
      roots: ["apps/web/src/app/themes"],
      featureDirs: ["apps/web/src/features/theme-dashboard"],
    };
  }
  // /fishing-ports
  if (pathname.startsWith("/fishing-ports")) {
    return {
      pathname,
      roots: ["apps/web/src/app/fishing-ports"],
      featureDirs: ["apps/web/src/features/fishing-ports"],
    };
  }
  // /ports
  if (pathname.startsWith("/ports")) {
    return {
      pathname,
      roots: ["apps/web/src/app/ports"],
      featureDirs: ["apps/web/src/features/port-statistics"],
    };
  }
  // /tag
  if (pathname.startsWith("/tag")) {
    return {
      pathname,
      roots: ["apps/web/src/app/tag"],
      featureDirs: [],
    };
  }

  return { pathname, roots: [], featureDirs: [] };
}

// -------- ファイル探索 --------
function findTsxFiles(root) {
  const abs = path.join(PROJECT_ROOT, root);
  if (!fs.existsSync(abs)) return [];
  const stat = fs.statSync(abs);
  if (stat.isFile()) return [root];
  try {
    const out = execSync(
      `find "${abs}" -name "*.tsx" -type f -not -path "*/node_modules/*"`,
      { encoding: "utf-8" }
    );
    return out
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((p) => path.relative(PROJECT_ROOT, p));
  } catch {
    return [];
  }
}

// -------- git 情報 --------
function gitInfo(relFile) {
  try {
    const out = execSync(
      `git -C "${PROJECT_ROOT}" log -1 --format="%h|%ad" --date=short -- "${relFile}"`,
      { encoding: "utf-8" }
    ).trim();
    if (!out) return { hash: "(no history)", date: "-" };
    const [hash, date] = out.split("|");
    return { hash, date };
  } catch {
    return { hash: "(no history)", date: "-" };
  }
}

// -------- 改善ヒント (ファイル名パターン → 過去施策へのポインタ) --------
const HINT_PATTERNS = [
  {
    re: /Map|Tile|Leaflet|Choropleth/i,
    hint: "dynamic import + tile preload (T1-PSI-LCP-02)",
  },
  { re: /Chart|D3|BarChart|LineChart/i, hint: "aspect-ratio 予約で CLS 抑制" },
  { re: /Image|Thumbnail|Cover/i, hint: "next/image priority + sizes 確認" },
  { re: /Table|Ranking.*List/i, hint: "list 仮想化 / 初期表示件数を絞る" },
  { re: /Layout|page\.tsx$/i, hint: "server component 化 / cookies() 撤去" },
  { re: /Search|Filter/i, hint: "client bundle 分割・debounce" },
];

function hintFor(file) {
  for (const { re, hint } of HINT_PATTERNS) {
    if (re.test(file)) return hint;
  }
  return "-";
}

// -------- per-URL レンダリング --------
function buildCandidatesForUrl(url) {
  const { pathname, roots, featureDirs } = urlToCandidateRoots(url);
  const allRoots = [...roots, ...featureDirs];
  const files = new Set();
  for (const r of allRoots) {
    for (const f of findTsxFiles(r)) files.add(f);
  }

  const enriched = [...files].map((f) => {
    const g = gitInfo(f);
    return { file: f, date: g.date, hash: g.hash, hint: hintFor(f) };
  });

  // 最終更新日が新しい順
  enriched.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return {
    url,
    pathname,
    matchedRoots: allRoots,
    candidates: enriched.slice(0, MAX),
    totalFound: enriched.length,
  };
}

function renderMarkdown(results) {
  const lines = [];
  for (const r of results) {
    lines.push(`## CWV 修正候補 (URL: ${r.pathname})`);
    lines.push("");
    if (r.candidates.length === 0) {
      lines.push(
        `_no candidate found_ (matched roots: ${
          r.matchedRoots.join(", ") || "none"
        })`
      );
      lines.push("");
      continue;
    }
    lines.push("| File | Last Modified | Commit | Hint |");
    lines.push("|---|---|---|---|");
    for (const c of r.candidates) {
      lines.push(`| ${c.file} | ${c.date} | ${c.hash} | ${c.hint} |`);
    }
    lines.push("");
    lines.push("### 改善提案ポインタ");
    lines.push("- LCP/CLS 過去施策: `docs/05_改善ログ/psi.md`");
    lines.push(
      "- 詳細ログ: `.claude/skills/analytics/performance-improvement/reference/improvement-log.md`"
    );
    lines.push(
      `- 検証コマンド: \`curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp${r.pathname}&strategy=mobile"\``
    );
    lines.push("");
  }
  return lines.join("\n");
}

// -------- main --------
const results = urls.map(buildCandidatesForUrl);

if (FORMAT === "json") {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log(renderMarkdown(results));
}

process.exit(0);
