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

## 生成者の制約（審査の前提）

- 生成者は数値・順位を提供データ（各県の順位・値・7地方区分・全国平均）だけから書き、施設名・政策名・制度名・企業名の使用を禁止されている。太平洋側 / 日本海側・都市部 / 地方部・内陸といった一般的な地理の言及は許されている（ただし地理として誤っていれば MAJOR。例: 静岡県や長野県を日本海側と書く）
- したがって県別解説に「県固有の背景説明」を要求しない。固有性は、順位帯・地方内の位置・全国平均との距離・隣接県との対比・順位帯の密集度の**組み合わせ**が県ごとに変わっているかで判断する
- regionalAnalysis は地方ごとに代表例 1 県までしか数値を挙げない規定なので、ある県が regionalAnalysis に登場しないことは矛盾でも誤りでもない

## 判定規則

- 機械監査で捕まえにくい意味品質だけを見る
- insights と regionalAnalysis が同じ内容を反復していない
- 順位や県名の読み上げではなく、分布の読み解きになっている
- 因果を断定せず、中立なですます調である
- 県別解説の「定型文の置換」は、着眼点の組み合わせも文構造も同じ解説が半数を超える場合だけ MAJOR。構文が似ていても着眼点の組み合わせが県ごとに変わっていれば MINOR
- 数値・順位・地方所属・「地方内で最も高い / 低い」の主張が、審査対象 JSON 内の他の記述と矛盾するものは MAJOR（誤りが公開される）
- 文字化け・JSON としての破損は BLOCK
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
