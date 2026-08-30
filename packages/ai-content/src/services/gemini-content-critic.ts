import {
  generateContentText,
  type GeminiTokenUsage,
} from "./gemini-text-client";
import { GEMINI_CRITIC_RESPONSE_SCHEMA } from "./gemini-content-schemas";

export interface GeminiCriticIssue {
  section: "faq" | "regionalAnalysis" | "insights" | "prefectureCommentary" | "overall";
  severity: "BLOCK" | "MAJOR" | "MINOR";
  message: string;
}

export interface GeminiCriticVerdict {
  verdict: "PASS" | "REVISE";
  issues: GeminiCriticIssue[];
  attempts: number;
  usage: GeminiTokenUsage;
}

export function buildGeminiCriticPrompt(rankingKey: string, candidate: unknown): string {
  return `あなたはランキングページ解説の独立レビュアーです。生成者とは別コンテキストで審査してください。

## 判定規則

- 機械監査で捕まえにくい意味品質だけを見る
- insights と regionalAnalysis が同じ内容を反復していない
- 順位や県名の読み上げではなく、分布の読み解きになっている
- 因果を断定せず、中立なですます調である
- 県別解説が同じ定型文の置換だけになっていない
- FAQ が自然な検索質問で、回答が簡潔である
- BLOCK または MAJOR が1件でもあれば REVISE。MINORだけならPASSにしてよい
- 修正文は作らず、問題箇所と理由だけを返す

rankingKey: ${rankingKey}

## 審査対象JSON

${JSON.stringify(candidate)}`;
}

export function parseGeminiCriticVerdict(
  text: string,
): Omit<GeminiCriticVerdict, "attempts" | "usage"> {
  const parsed = JSON.parse(text) as Partial<GeminiCriticVerdict>;
  if (parsed.verdict !== "PASS" && parsed.verdict !== "REVISE") {
    throw new Error("critic verdict が PASS / REVISE ではありません");
  }
  if (!Array.isArray(parsed.issues)) throw new Error("critic issues が配列ではありません");
  const issues = parsed.issues as GeminiCriticIssue[];
  // モデルが PASS と書いても BLOCK / MAJOR を同時に返したら決定的に REVISE。
  const hasBlockingIssue = issues.some(
    (issue) => issue.severity === "BLOCK" || issue.severity === "MAJOR",
  );
  return { verdict: hasBlockingIssue ? "REVISE" : parsed.verdict, issues };
}

export async function reviewAiContentWithGemini(options: {
  rankingKey: string;
  candidate: unknown;
  apiKey: string;
  model?: string;
  maxAttempts?: number;
}): Promise<GeminiCriticVerdict> {
  const generated = await generateContentText({
    prompt: buildGeminiCriticPrompt(options.rankingKey, options.candidate),
    apiKey: options.apiKey,
    model: options.model,
    responseJsonSchema: GEMINI_CRITIC_RESPONSE_SCHEMA,
    temperature: 0.1,
    maxOutputTokens: 2_048,
    maxAttempts: options.maxAttempts,
  });
  return {
    ...parseGeminiCriticVerdict(generated.text),
    attempts: generated.attempts,
    usage: generated.usage,
  };
}
