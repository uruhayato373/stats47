/**
 * 生成済み EPUB の機械検証。
 *
 * 実行:
 *   npx tsx packages/product-factory/scripts/verify-epub.mts            # 全書籍
 *   npx tsx packages/product-factory/scripts/verify-epub.mts --book K-S1-01
 *
 * ★2 層に分ける理由 (2026-08-12 の実測)
 *   Kindle Previewer で「表紙が描画されない / 途中ページが表示されない / 改ページが不適切」の
 *   3 症状が出たとき、**epubcheck は全 32 冊で 0 error 0 warning だった**。原因は素の `<img>` で
 *   表紙を置いていたことで、1600×2560 の高さがページを超えて表紙が複数ページに割れ、以降の
 *   ページ境界をすべて汚していた。構文は妥当でレイアウトだけ壊れる類なので、**仕様適合検査
 *   (epubcheck) だけでは検出できない**。
 *
 *   したがって:
 *     ① 仕様適合   — epubcheck (KDP の受理条件。外部ツール)
 *     ② レイアウト不変量 — 本スクリプトが zip 内の XHTML/OPF を直接検査 (この 3 症状の再発防止)
 *
 *   ②の不変量は `.claude/rules/coconala-product-standards.md` §8 の表が正典で、
 *   生成器側のユニットテスト (`src/generators/__tests__/epub.test.ts`) と同じことを
 *   **生成物に対して**確かめる (生成器を通さず手で置いた EPUB も検査できる)。
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PF_ROOT = resolve(HERE, "..");
const BOOKS_DIR = resolve(PF_ROOT, "../../.local/kindle-books");

const KNOWN_FLAGS = new Set(["--book", "--json", "--skip-epubcheck"]);
function assertKnownFlags(): void {
  const unknown = process.argv.slice(2).filter((a) => a.startsWith("--") && !KNOWN_FLAGS.has(a));
  if (unknown.length > 0) {
    console.error(`未知のフラグ: ${unknown.join(", ")}\n使えるのは ${[...KNOWN_FLAGS].join(" / ")} です。`);
    process.exit(2);
  }
}
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** zip から 1 エントリを取り出す (無ければ null)。 */
function unzipText(epub: string, entry: string): string | null {
  try {
    return execFileSync("unzip", ["-p", epub, entry], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  } catch {
    return null;
  }
}

function listEntries(epub: string): string[] {
  const out = execFileSync("unzip", ["-Z1", epub], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  return out.split("\n").map((s) => s.trim()).filter(Boolean);
}

interface Finding {
  readonly level: "error" | "warn";
  readonly code: string;
  readonly msg: string;
}

/**
 * レイアウト不変量。epubcheck が見ない「読めるか」を見る。
 * 不変量の正典は `.claude/rules/coconala-product-standards.md` §8。
 */
function checkLayout(epub: string): Finding[] {
  const f: Finding[] = [];
  const entries = listEntries(epub);
  const opfPath = entries.find((e) => e.endsWith(".opf"));
  if (!opfPath) {
    f.push({ level: "error", code: "no-opf", msg: "OPF が無い" });
    return f;
  }
  const opf = unzipText(epub, opfPath) ?? "";
  const hasCoverImage = entries.some((e) => /cover\.(png|jpe?g)$/i.test(e));
  const cover = unzipText(epub, opfPath.replace(/[^/]+$/, "cover.xhtml"));

  if (hasCoverImage) {
    if (!cover) {
      f.push({ level: "error", code: "cover-missing", msg: "表紙画像はあるが cover.xhtml が無い" });
    } else {
      // ★これが 3 症状の根本原因だった。素の <img> は高さがページを超えて割れる。
      if (!/preserveAspectRatio\s*=\s*"xMidYMid meet"/.test(cover)) {
        f.push({
          level: "error",
          code: "cover-not-svg-wrapped",
          msg: "表紙が SVG ラップされていない (素の <img> は高さがページを超えて表紙が複数ページに割れる)",
        });
      }
      if (!/viewBox\s*=\s*"0 0 \d+ \d+"/.test(cover)) {
        f.push({ level: "error", code: "cover-no-viewbox", msg: "表紙 SVG に viewBox が無い" });
      }
      if (/<link[^>]+style\.css/.test(cover)) {
        f.push({
          level: "error",
          code: "cover-links-css",
          msg: "cover.xhtml が style.css をリンクしている (body margin で表紙が中央からずれる)",
        });
      }
      if (!/properties\s*=\s*"[^"]*\bsvg\b[^"]*"/.test(opf)) {
        f.push({ level: "error", code: "cover-no-svg-property", msg: 'OPF の cover item に properties="svg" が無い' });
      }
      if (!/<meta\s+name\s*=\s*"cover"/.test(opf)) {
        f.push({ level: "warn", code: "no-legacy-cover-meta", msg: "legacy の <meta name=\"cover\"> が無い (Kindle のサムネイル識別)" });
      }
    }
  }

  const navPath = entries.find((e) => /nav\.xhtml$/.test(e));
  const nav = navPath ? unzipText(epub, navPath) : null;
  if (!nav) {
    f.push({ level: "error", code: "no-nav", msg: "nav.xhtml が無い" });
  } else {
    if (!/epub:type\s*=\s*"landmarks"/.test(nav)) {
      f.push({ level: "error", code: "no-landmarks", msg: "nav に landmarks が無い (読書開始位置を識別できない)" });
    }
    if (!/epub:type\s*=\s*"bodymatter"/.test(nav)) {
      f.push({ level: "error", code: "no-bodymatter", msg: "landmarks に bodymatter が無い" });
    }
  }

  // 目次が spine に入っていないと「目次ページが表示されない」。
  if (navPath && !new RegExp(`idref\\s*=\\s*"[^"]*"`).test(opf)) {
    f.push({ level: "error", code: "no-spine", msg: "spine が空" });
  }
  if (navPath) {
    const navId = opf.match(new RegExp(`<item[^>]+href="[^"]*${navPath.split("/").pop()}"[^>]*id="([^"]+)"`))?.[1]
      ?? opf.match(new RegExp(`<item[^>]+id="([^"]+)"[^>]*href="[^"]*${navPath.split("/").pop()}"`))?.[1];
    if (navId && !new RegExp(`idref\\s*=\\s*"${navId}"`).test(opf)) {
      f.push({ level: "error", code: "nav-not-in-spine", msg: "目次が spine に無い (目次ページが表示されない)" });
    }
  }

  const cssPath = entries.find((e) => /style\.css$/.test(e));
  const css = cssPath ? unzipText(epub, cssPath) : null;
  if (!css) {
    f.push({ level: "error", code: "no-css", msg: "style.css が無い" });
  } else {
    // 「改ページが不適切」の再発防止。
    if (!/page-break-after\s*:\s*avoid/.test(css)) {
      f.push({ level: "error", code: "no-heading-break-guard", msg: "見出しの孤立を止める page-break-after:avoid が無い" });
    }
    if (!/max-height/.test(css)) {
      f.push({ level: "warn", code: "no-figure-height-cap", msg: "図の高さ上限が無い (図がページを跨ぐ)" });
    }
    if (!/page-break-before\s*:\s*always/.test(css)) {
      f.push({ level: "warn", code: "no-colophon-break", msg: "奥付の改ページが無い (扉と奥付が 1 ページに詰まる)" });
    }
  }
  return f;
}

function runEpubcheck(epub: string): Finding[] {
  try {
    execFileSync("epubcheck", [epub], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return [];
  } catch (e) {
    const out = `${(e as { stdout?: string }).stdout ?? ""}\n${(e as { stderr?: string }).stderr ?? ""}`;
    return out
      .split("\n")
      .filter((l) => /^(ERROR|WARNING)/.test(l))
      .map((l) => ({
        level: l.startsWith("ERROR") ? ("error" as const) : ("warn" as const),
        code: "epubcheck",
        msg: l.trim().slice(0, 200),
      }));
  }
}

function main(): void {
  assertKnownFlags();
  const only = arg("book");
  const skipEpubcheck = process.argv.includes("--skip-epubcheck");
  const asJson = process.argv.includes("--json");

  if (!existsSync(BOOKS_DIR)) {
    console.error(`生成物が無い: ${BOOKS_DIR}\n先に products:kindle:generate --all-manuscript を実行する。`);
    process.exit(1);
  }
  const ids = readdirSync(BOOKS_DIR).filter((d) => (only ? d === only : true)).sort();
  if (ids.length === 0) {
    console.error(only ? `書籍が見つからない: ${only}` : "書籍が 1 冊も無い");
    process.exit(1);
  }

  const hasEpubcheck = (() => {
    if (skipEpubcheck) return false;
    try {
      execFileSync("which", ["epubcheck"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  })();
  if (!skipEpubcheck && !hasEpubcheck) {
    // ★「入っていないから素通り」を黙ってやらない。何を検査しなかったかを出す。
    console.log("⚠️  epubcheck が無いので仕様適合検査はスキップ (brew install epubcheck)。レイアウト不変量だけ検査します。");
  }

  const report: Array<{ id: string; errors: number; warns: number; findings: Finding[] }> = [];
  let totalErr = 0;
  for (const id of ids) {
    const epub = join(BOOKS_DIR, id, "v1", "book.epub");
    if (!existsSync(epub)) continue;
    const findings = [...checkLayout(epub), ...(hasEpubcheck ? runEpubcheck(epub) : [])];
    const errors = findings.filter((x) => x.level === "error").length;
    const warns = findings.length - errors;
    totalErr += errors;
    report.push({ id, errors, warns, findings });
    if (!asJson) {
      const mark = errors > 0 ? "NG " : warns > 0 ? "WARN" : "OK ";
      console.log(`${mark} ${id.padEnd(10)} error ${errors} / warn ${warns}`);
      for (const x of findings) console.log(`      [${x.level}] ${x.code}: ${x.msg}`);
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ books: report.length, totalErrors: totalErr, report }, null, 2));
  } else {
    console.log(`\n合計: ${report.length} 冊 / error ${totalErr} 件${hasEpubcheck ? "" : " (epubcheck 未実行)"}`);
  }
  process.exit(totalErr > 0 ? 1 : 0);
}

main();
