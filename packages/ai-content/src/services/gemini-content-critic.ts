import {
  generateContentText,
  type GeminiTokenUsage,
} from "./gemini-text-client";
import { REGIONS, fetchPrefectures } from "@stats47/area";
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

function buildCandidateConsistencyTable(candidate: unknown): string {
  if (!candidate || typeof candidate !== "object") return "";
  const candidateRecord = candidate as Record<string, unknown>;
  const prefectureCommentary = candidateRecord.prefectureCommentary;
  if (!prefectureCommentary || typeof prefectureCommentary !== "object") return "";
  const items = (prefectureCommentary as Record<string, unknown>).items;
  if (!Array.isArray(items)) return "";

  const prefectures = fetchPrefectures();
  const nameToCode = new Map(
    prefectures.map((prefecture) => [prefecture.prefName, prefecture.prefCode]),
  );
  const codeToRegion = new Map<string, string>();
  for (const region of REGIONS) {
    for (const code of region.prefectures) codeToRegion.set(code, region.regionName);
  }
  const rows = items
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      areaName: String(item.areaName ?? ""),
      rank: Number(item.rank),
      value: Number(item.value),
      commentary: String(item.commentary ?? ""),
    }))
    .filter(
      (item) =>
        item.areaName.length > 0 && Number.isFinite(item.rank) && Number.isFinite(item.value),
    );
  const rowsByRegion = new Map<string, typeof rows>();
  for (const row of rows) {
    const code = nameToCode.get(row.areaName);
    const regionName = codeToRegion.get(code ?? "") ?? "地方区分なし";
    rowsByRegion.set(regionName, [...(rowsByRegion.get(regionName) ?? []), row]);
  }
  for (const [regionName, regionRows] of rowsByRegion) {
    rowsByRegion.set(regionName, [...regionRows].sort((a, b) => a.rank - b.rank));
  }
  const values = rows.map((row) => row.value);
  const average = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
  const above = values.filter((value) => value > average).length;
  const below = values.filter((value) => value < average).length;
  const ranked = [...rows].sort((a, b) => a.rank - b.rank);
  const topFiveSum = ranked.slice(0, 5).reduce((sum, row) => sum + row.value, 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  const topFiveShare = total > 0 ? (topFiveSum / total) * 100 : null;
  const areaNames = rows.map((row) => row.areaName).sort((a, b) => b.length - a.length);
  const normalizedTemplateCounts = new Map<string, number>();
  for (const row of rows) {
    const normalized = areaNames
      .reduce((text, areaName) => text.split(areaName).join("<県>"), row.commentary)
      .replace(/[+-]?[0-9０-９][0-9０-９,.，．]*/g, "<数>")
      .replace(/\s+/g, "")
      .trim();
    normalizedTemplateCounts.set(normalized, (normalizedTemplateCounts.get(normalized) ?? 0) + 1);
  }
  const maxNormalizedTemplateCount = Math.max(0, ...normalizedTemplateCounts.values());
  const summary =
    `- 候補JSON内の値から算出した全国平均=${average}; 平均より上=${above}県; 平均より下=${below}県\n` +
    `- rank順の先頭5件合計=${topFiveSum}; 全値合計=${total}; 構成比=${topFiveShare ?? "算出対象外"}％\n` +
    `- 県名と数値を正規化した県別解説の同一文型最大出現数=${maxNormalizedTemplateCount}/${rows.length}件`;
  const detail = rows
    .sort((a, b) => a.rank - b.rank)
    .map((row) => {
      const code = nameToCode.get(row.areaName);
      const regionName = codeToRegion.get(code ?? "") ?? "地方区分なし";
      const regionRows = rowsByRegion.get(regionName) ?? [];
      const localPosition = regionRows.findIndex((candidateRow) => candidateRow.areaName === row.areaName) + 1;
      const tieCount = rows.filter((candidateRow) => candidateRow.rank === row.rank).length;
      return `- ${row.areaName}: rank=${row.rank}, value=${row.value}, 同順位${tieCount}県, ${regionName}内${localPosition}/${regionRows.length}番手`;
    })
    .join("\n");
  return `${summary}\n${detail}`;
}

export function buildGeminiCriticPrompt(rankingKey: string, candidate: unknown): string {
  const codeToName = new Map(
    fetchPrefectures().map((prefecture) => [prefecture.prefCode, prefecture.prefName]),
  );
  const regionMap = REGIONS.map(
    (region) =>
      `- ${region.regionName}: ${region.prefectures
        .map((code) => codeToName.get(code) ?? code)
        .join("、")}`,
  ).join("\n");
  const consistencyTable = buildCandidateConsistencyTable(candidate);
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
- 順位帯という必須語彙や共通する比較語だけの反復を定型MAJORにしない。同じ2観点以上を同じ文順で使う解説が24件以上ある場合に限りMAJORとする
- 候補内照合表の「同一文型最大出現数」が24件未満なら、共通語彙の存在だけで定型文MAJORにしない。読者価値への懸念はMINORに留める
- 数値・順位・地方所属・「地方内で最も高い / 低い」の主張が、審査対象 JSON 内の他の記述と矛盾するものは MAJOR（誤りが公開される）
- 候補内照合表がある場合、平均・平均上下の県数・先頭5件合計・rank・value・同順位数・地方内番手・文型出現数の**候補内整合性**はその表で判定する。valueから順位を並べ直したり、同順位や集計値を独自に計算し直したりしない
- 候補内照合表は候補JSONから抽出したもので、外部ソースに対する正確性を保証しない。事実矛盾を指摘するときは、候補本文に実際に書かれている文言と表の値を引用して照合し、候補に存在しない文言を推定して指摘しない
- 文字化け・JSON としての破損は BLOCK
- FAQ が自然な検索質問で、回答が簡潔である
- 地方所属は一般的な別区分ではなく、下記の「このサイトの7地方区分」を正典として判定する
- BLOCK または MAJOR が1件でもあれば REVISE。MINORだけならPASSにしてよい
- 修正文は作らず、問題箇所と理由だけを返す

## このサイトの7地方区分

${regionMap}

## 候補JSONから決定的に抽出した内部整合性表

${consistencyTable || "照合表なし"}

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
