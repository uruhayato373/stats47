import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * 外部リンクは新しいタブで開く (サイト共通の規約)。
 *
 * 外部サイトへのリンクは `ExternalAnchor` (`src/components/atoms/ExternalAnchor.tsx`) で書く。
 * 手書きの `<a>` は新しいタブの指定を忘れやすく、2026-09-25 の実測では `/geo/layers` の外部リンク
 * 47 本中 43 本が同じタブで開いていた。記事本文 (markdown) のリンクは md-content が外部 URL に
 * 自動で付けるので、ここではコードに書いた `<a>` だけを検査する。描画後の HTML は週次のページ品質監査
 * (`external_links_same_tab`) が全 URL で数える。
 *
 * 正典: `docs/01_技術設計/04_デザインシステム.md`「外部リンク」
 */

const ROOT = process.cwd();
const SRC = path.resolve(ROOT, "src");

/**
 * href を変数で渡し、新しいタブを指定しない `<a>` のうち、サイト内を指すと確認済みのもの。
 * 件数は増やさない (サイト内リンクは next/link の Link、外部は ExternalAnchor で書く)。
 */
const SAME_TAB_DYNAMIC_ANCHORS: Record<string, string> = {
  "src/app/products/[slug]/from/note/[noteKey]/page.tsx": "meta refresh で商品ページへ転送する中継ページの代替リンク",
  "src/components/stat-charts/components/cards/MultiStatCard/MultiStatCardClient.tsx": "ランキングページへのサイト内リンク",
  "src/components/stat-charts/components/cards/StatsTable/StatsTableClient.tsx": "ランキングページへのサイト内リンク",
  "src/features/ranking/components/DataUsageCard/DataUsageCard.tsx": "サイト内 API の CSV ダウンロード",
};

const SITE_HOST = /^https?:\/\/(?:www\.)?stats47\.jp(?:[/?#]|$)/;

function listTsx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    if (statSync(abs).isDirectory()) {
      if (["node_modules", ".next", "__tests__"].includes(entry)) continue;
      out.push(...listTsx(abs));
      continue;
    }
    if (entry.endsWith(".tsx") && !entry.endsWith(".test.tsx")) out.push(abs);
  }
  return out;
}

/** コメント内の例示 (`<a href="https://…">`) を拾わないよう、行番号を保ったままコメントを空白にする */
function blankComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/[^\n]*/gm, (match) => match.replace(/[^\n]/g, " "));
}

interface AnchorTag {
  file: string;
  line: number;
  tag: string;
}

const ANCHORS: AnchorTag[] = listTsx(SRC).flatMap((abs) => {
  const file = path.relative(ROOT, abs).split(path.sep).join("/");
  const source = blankComments(readFileSync(abs, "utf8"));
  return [...source.matchAll(/<a\b(?:[^>]|=>)*?>/gs)].map((match) => ({
    file,
    line: source.slice(0, match.index).split("\n").length,
    tag: match[0],
  }));
});

const hasTargetBlank = (tag: string) => /target=(?:"_blank"|\{"_blank"\})/.test(tag);
const spreadsProps = (tag: string) => /\{\.\.\./.test(tag);
const literalHref = (tag: string) => tag.match(/href=(?:"([^"]*)"|\{["`]([^"`$]*))/)?.slice(1).find(Boolean);

describe("external link contract", () => {
  it("URL を直書きした外部リンクは新しいタブで開く (ExternalAnchor を使う)", () => {
    const offenders = ANCHORS.filter(({ tag }) => {
      const href = literalHref(tag);
      return href !== undefined && /^https?:\/\//.test(href) && !SITE_HOST.test(href) && !hasTargetBlank(tag);
    }).map(({ file, line }) => `${file}:${line}`);
    expect(offenders).toEqual([]);
  });

  it("href を変数で渡す <a> が新しいタブを指定しないのは、登録済みのサイト内リンクだけ", () => {
    const sameTabFiles = new Set(
      ANCHORS.filter(
        ({ tag }) => /href=\{(?!["`])/.test(tag) && !hasTargetBlank(tag) && !spreadsProps(tag),
      ).map(({ file }) => file),
    );
    expect([...sameTabFiles].sort()).toEqual(Object.keys(SAME_TAB_DYNAMIC_ANCHORS).sort());
  });

  it("新しいタブで開く <a> は rel に noopener を含める", () => {
    const offenders = ANCHORS.filter(
      ({ tag }) => hasTargetBlank(tag) && !spreadsProps(tag) && !/rel=["{][^>]*noopener/.test(tag),
    ).map(({ file, line }) => `${file}:${line}`);
    expect(offenders).toEqual([]);
  });
});
