import type { PageAuditResult } from "../types";
import { findChartTextIssues } from "../../lib/svg-lint.mjs";
import { resolveDispatcher } from "./http-dispatcher";

/** 記事に <img> で埋め込んだ静的チャート (svg-builder の出力)。ロゴ等の SVG は取得しない。 */
const ARTICLE_CHART_SVG = /\/app\/blog\/[^/]+\/data\/[^/]+\.svg$/;
const MAX_FINDINGS_PER_PAGE = 10;

export type SvgFetcher = (url: string) => Promise<string | null>;

/** 取得できなかった SVG は「文字が切れている」証拠ではないので null を返し、件数に数えない。 */
export const fetchSvgText: SvgFetcher = async (url) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "stats47-page-quality-audit/1.0" },
        signal: AbortSignal.timeout(20_000),
        // @ts-expect-error undiciのdispatcherはfetchのRequestInit型に無いが実行時は解釈される
        dispatcher: resolveDispatcher(url),
      });
      if (!res.ok) return null; // 404 は broken_images が数える
      return await res.text();
    } catch {
      // 通信失敗は次の試行へ
    }
  }
  return null;
};

type SvgResult = { issues: string[] } | null;

/**
 * 全ページの記事チャート SVG を重複なく 1 回ずつ取得し、文字のはみ出し・重なりを静的に検査して
 * ページごとの blog_svg_text_issues (不具合のある SVG の枚数) と ui_findings を埋める。
 * <img> の中身はブラウザ検査 (chart_text_issues) から見えないので、この検査が全記事を見る。
 * checkImages が image_urls を消す前に呼ぶこと。
 */
export async function checkSvgText(
  results: PageAuditResult[],
  { concurrency = 8, fetchSvg = fetchSvgText }: { concurrency?: number; fetchSvg?: SvgFetcher } = {}
): Promise<{ checked: number; withIssues: number; unverified: number }> {
  const unique = [...new Set(results.flatMap((r) => (r.image_urls ?? []).filter((u) => ARTICLE_CHART_SVG.test(u))))];
  const outcomes = new Map<string, SvgResult>();
  let cursor = 0;
  async function worker() {
    while (cursor < unique.length) {
      const url = unique[cursor++];
      const svg = await fetchSvg(url);
      if (svg === null) {
        outcomes.set(url, null);
        continue;
      }
      const { overflows, overlaps } = findChartTextIssues(svg);
      outcomes.set(url, { issues: [...overflows.map((o) => `はみ出し ${o}`), ...overlaps.map((o) => `重なり ${o}`)] });
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, worker));

  for (const result of results) {
    const urls = (result.image_urls ?? []).filter((u) => ARTICLE_CHART_SVG.test(u));
    if (urls.length === 0) continue;
    const bad = urls.filter((u) => (outcomes.get(u)?.issues.length ?? 0) > 0);
    result.metrics.blog_svg_text_issues = bad.length;
    if (bad.length === 0) continue;
    const findings = bad
      .map((u) => {
        const issues = outcomes.get(u)?.issues ?? [];
        return `blog_svg_text: ${u} (${issues.length} 件: ${issues.slice(0, 3).join(" / ")})`;
      })
      .slice(0, MAX_FINDINGS_PER_PAGE);
    result.ui_findings = [...(result.ui_findings ?? []), ...findings];
  }

  const values = [...outcomes.values()];
  return {
    checked: unique.length,
    withIssues: values.filter((v) => v !== null && v.issues.length > 0).length,
    unverified: values.filter((v) => v === null).length,
  };
}
