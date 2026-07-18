/**
 * claims validator (仕様 §8・§13)。
 * 誇大表現・根拠なしの収益/時短保証・e-Stat 公認示唆・相関=因果の断定・markdown 表を機械検出する。
 * 記事プランのテキスト (title / readerJob) と、生成済み draft.md 本文の両方に適用できる純関数。
 */
import type { NoteIssue } from "./types";
import type { NoteArticlePlan } from "../types";
import { CANONICAL_ARTICLES } from "../article-plan";

/** 禁止表現。誇大・保証・公認示唆。仕様 §8。 */
export const BANNED_PHRASES: readonly { readonly pattern: RegExp; readonly label: string }[] = [
  { pattern: /誰でも必ず/, label: "誰でも必ず" },
  { pattern: /必ず(?:売上|収益|成果)/, label: "必ず〜(売上/収益/成果)" },
  { pattern: /売上(?:が)?(?:必ず)?(?:上がり|上がる|アップ(?:します|する))/, label: "売上が上がる" },
  { pattern: /収益(?:を)?保証/, label: "収益保証" },
  { pattern: /絶対(?:安全|確実|儲かる)/, label: "絶対安全/確実/儲かる" },
  { pattern: /100%(?:安全|確実|成功)/, label: "100%安全/確実/成功" },
  { pattern: /e-?Stat\s*(?:公認|推奨|認定|お墨付き)/i, label: "e-Stat 公認/推奨の示唆" },
  { pattern: /(?:国|政府|府省|総務省|自治体)(?:公認|推奨|認定)/, label: "行政の公認/推奨の示唆" },
  { pattern: /相関(?:が|は)?あるので(?:原因|因果)/, label: "相関を因果と断定" },
];

/** 与えられたテキストから禁止表現・markdown 表を検出する。 */
export function scanText(text: string, ref: string): NoteIssue[] {
  const issues: NoteIssue[] = [];
  for (const { pattern, label } of BANNED_PHRASES) {
    if (pattern.test(text)) {
      issues.push({ code: "banned-phrase", ref, message: `禁止表現「${label}」を検出` });
    }
  }
  // markdown 表 (区切り行) を本文に残さない (仕様 §8)。
  if (/^\s*\|?[\s:-]*\|[\s:-]*\|/m.test(text) && /\|\s*-{3,}/.test(text)) {
    issues.push({ code: "markdown-table", ref, message: "markdown 表が本文に含まれる (画像計画へ回す)" });
  }
  return issues;
}

export function checkClaims(
  articles: readonly NoteArticlePlan[] = CANONICAL_ARTICLES,
): { errors: NoteIssue[]; warnings: NoteIssue[] } {
  const errors: NoteIssue[] = [];
  const warnings: NoteIssue[] = [];
  for (const article of articles) {
    for (const issue of scanText(`${article.title}\n${article.readerJob}`, article.slug)) {
      errors.push(issue);
    }
  }
  return { errors, warnings };
}
