/**
 * topic 解決の純関数。exporter / validator / テストが共有する唯一の実装。
 *
 * 判定順:
 *   1. `overrides[metricKey]`        — 規則で拾えない / 誤分類されるものの個別指定
 *   2. `topics[].matchers` を配列順  — 最初に一致したものを採用 (先勝ち)
 *   3. `OTHER_TOPIC_KEY`             — 受け皿
 */
import {
  OTHER_TOPIC_KEY,
  type CategoryTopicCatalog,
  type TopicMatcher,
  type TopicResolutionInput,
} from "./types";

/** 正規表現のコンパイル結果をカタログ横断で使い回す (metric 2295 件 × matcher 数の再生成を避ける) */
const patternCache = new Map<string, RegExp>();

function toRegExp(pattern: string): RegExp {
  const cached = patternCache.get(pattern);
  if (cached) return cached;
  const compiled = new RegExp(pattern);
  patternCache.set(pattern, compiled);
  return compiled;
}

function matches(matcher: TopicMatcher, input: TopicResolutionInput): boolean {
  if (matcher.kind === "title") {
    return toRegExp(matcher.pattern).test(input.title);
  }
  // kakei-cat01: 家計調査品目コードの前方一致。コードを持たない metric は対象外
  const code = input.cdCat01;
  if (!code) return false;
  return matcher.prefixes.some((prefix) => code.startsWith(prefix));
}

/**
 * metric が属する topic key を返す。どの規則にも一致しなければ `OTHER_TOPIC_KEY`。
 *
 * カタログ自体の妥当性 (key 重複・不正な正規表現・overrides の宛先不明) は
 * `validate-topic-catalog.ts` が検査する。ここでは検査しない。
 */
export function resolveTopicKey(
  input: TopicResolutionInput,
  catalog: CategoryTopicCatalog,
): string {
  const override = catalog.overrides?.[input.key];
  if (override) return override;

  for (const topic of catalog.topics) {
    for (const matcher of topic.matchers) {
      if (matches(matcher, input)) return topic.key;
    }
  }
  return OTHER_TOPIC_KEY;
}

/** テスト用: 正規表現キャッシュを空にする */
export function clearTopicPatternCache(): void {
  patternCache.clear();
}
