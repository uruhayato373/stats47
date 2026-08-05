/**
 * `MetricConfig` から topic 解決の入力を作る。
 *
 * exporter・validator・テストがこの 1 箇所を通ることで、
 * 「どのフィールドを見て分類しているか」が散らばらないようにする。
 */
import type { MetricConfig } from "../types";
import type { TopicResolutionInput } from "./types";

/**
 * 家計調査品目コードを取り出す。
 *
 * `KakeiChousaSource.filter` は `Record<string, unknown>` (実データは入れ子の
 * `{name,url}` も含む) なので、文字列であることを確認してから返す。
 * 家計調査以外の source では `null`。
 */
function extractKakeiCat01(config: MetricConfig): string | null {
  const source = config.source;
  if (!source || source.kind !== "kakei-chousa") return null;
  const value = source.filter?.["cdCat01"];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function toTopicResolutionInput(
  config: MetricConfig,
): TopicResolutionInput {
  return {
    key: config.key,
    title: config.title,
    cdCat01: extractKakeiCat01(config),
  };
}
