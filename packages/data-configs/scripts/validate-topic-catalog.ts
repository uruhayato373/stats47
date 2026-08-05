/**
 * validate-topic-catalog — Topic カタログ (カテゴリ内グループ分類) の内整合を検証する lint。
 *
 * 規約の正典: `packages/data-configs/src/topics/README.md`
 *
 * error (exit 1 / CI・pre-commit をブロック):
 *   - categoryKey が 17 軸外 / カタログ間で重複
 *   - topic key の重複 (カタログ内)
 *   - 予約語 "other" をカタログで定義
 *   - matcher の正規表現が不正
 *   - overrides の metricKey が METRICS_REGISTRY に不在
 *   - overrides の対象 metric がそのカテゴリに属さない
 *   - overrides の宛先 topicKey が未定義 ("other" は許容)
 * warn (exit 0 / 表示のみ, --strict で error):
 *   - 実 metric が 1 件も一致しない topic (死んだ群)
 *   - 分類済み率が 50% 未満のカタログ
 *
 * 使い方:
 *   npx tsx packages/data-configs/scripts/validate-topic-catalog.ts
 *   npx tsx packages/data-configs/scripts/validate-topic-catalog.ts --strict
 */
import { METRICS_REGISTRY } from "../src/registry";
import { listTopicCatalogs } from "../src/topics";
import { toTopicResolutionInput } from "../src/topics/from-metric";
import { resolveTopicKey } from "../src/topics/resolve-topic";
import { OTHER_TOPIC_KEY } from "../src/topics/types";
import { CATEGORY_KEYS } from "../src/types";
import type { MetricConfig } from "../src/types";

const STRICT = process.argv.includes("--strict");
const VALID_CATEGORIES = new Set<string>(CATEGORY_KEYS);
/** 分類済み率がこれを下回るカタログは warn。規則がほぼ効いていない状態を検出する */
const MIN_CLASSIFIED_RATIO = 0.5;

function tally(messages: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const message of messages) {
    const tag = message.match(/^\[([a-z-]+)\]/)?.[1] ?? "other";
    counts[tag] = (counts[tag] ?? 0) + 1;
  }
  return counts;
}

/** そのカテゴリに属する active metric。additionalCategories 経由の所属も含む */
function metricsOfCategory(categoryKey: string): MetricConfig[] {
  return Object.values(METRICS_REGISTRY).filter((config) => {
    if (config.isActive === false) return false;
    if (config.category === categoryKey) return true;
    return (config.additionalCategories ?? []).includes(categoryKey);
  });
}

function main(): void {
  const errors: string[] = [];
  const warns: string[] = [];
  const catalogs = listTopicCatalogs();
  const seenCategories = new Set<string>();

  for (const catalog of catalogs) {
    const { categoryKey } = catalog;

    if (!VALID_CATEGORIES.has(categoryKey)) {
      errors.push(`[category-key] ${categoryKey}: 17 軸に存在しない categoryKey`);
    }
    if (seenCategories.has(categoryKey)) {
      errors.push(`[category-dup] ${categoryKey}: 同じ categoryKey のカタログが複数ある`);
    }
    seenCategories.add(categoryKey);

    const topicKeys = new Set<string>();
    // 不正な正規表現があると後段の resolveTopicKey が throw する。
    // 記録した error を報告する前にクラッシュさせないため、解決フェーズを飛ばす
    let hasBadPattern = false;
    for (const topic of catalog.topics) {
      if (topic.key === OTHER_TOPIC_KEY) {
        errors.push(
          `[reserved-key] ${categoryKey}: "${OTHER_TOPIC_KEY}" は受け皿の予約語なのでカタログで定義できない`,
        );
      }
      if (topicKeys.has(topic.key)) {
        errors.push(`[topic-dup] ${categoryKey}: topic key "${topic.key}" が重複`);
      }
      topicKeys.add(topic.key);

      for (const matcher of topic.matchers) {
        if (matcher.kind !== "title") continue;
        try {
          new RegExp(matcher.pattern);
        } catch (error) {
          hasBadPattern = true;
          errors.push(
            `[bad-pattern] ${categoryKey}/${topic.key}: 不正な正規表現 ${JSON.stringify(matcher.pattern)} (${String(error)})`,
          );
        }
      }
    }

    // overrides の宛先と対象の実在
    for (const [metricKey, topicKey] of Object.entries(catalog.overrides ?? {})) {
      const config = METRICS_REGISTRY[metricKey];
      if (!config) {
        errors.push(`[override-metric] ${categoryKey}: overrides の "${metricKey}" が registry に不在`);
        continue;
      }
      const belongs =
        config.category === categoryKey ||
        (config.additionalCategories ?? []).includes(categoryKey);
      if (!belongs) {
        errors.push(
          `[override-category] ${categoryKey}: "${metricKey}" は category=${config.category} でこのカタログに属さない`,
        );
      }
      if (topicKey !== OTHER_TOPIC_KEY && !topicKeys.has(topicKey)) {
        errors.push(
          `[override-topic] ${categoryKey}: overrides の宛先 "${topicKey}" が topics に無い`,
        );
      }
    }

    // 実 metric に当てて死んだ群 / 低カバレッジを検出
    // (不正な正規表現がある状態で resolveTopicKey を呼ぶと throw するので飛ばす)
    if (hasBadPattern) continue;
    const metrics = metricsOfCategory(categoryKey);
    if (metrics.length === 0) continue;
    const hit = new Map<string, number>();
    for (const config of metrics) {
      const key = resolveTopicKey(toTopicResolutionInput(config), catalog);
      hit.set(key, (hit.get(key) ?? 0) + 1);
    }
    for (const topic of catalog.topics) {
      if (!hit.get(topic.key)) {
        warns.push(
          `[empty-topic] ${categoryKey}/${topic.key}: 実 metric が 1 件も一致しない`,
        );
      }
    }
    const classified = metrics.length - (hit.get(OTHER_TOPIC_KEY) ?? 0);
    const ratio = classified / metrics.length;
    if (ratio < MIN_CLASSIFIED_RATIO) {
      warns.push(
        `[low-coverage] ${categoryKey}: 分類済み ${Math.round(ratio * 100)}% (${classified}/${metrics.length})`,
      );
    }
  }

  console.log(
    `topic-catalog 検証: カタログ ${catalogs.length} / 未登録カテゴリ ${CATEGORY_KEYS.length - catalogs.length}`,
  );
  if (warns.length > 0) {
    console.log("⚠️  warn 内訳:", tally(warns));
    for (const w of warns.slice(0, 30)) console.log("   " + w);
    if (warns.length > 30) console.log(`   … 他 ${warns.length - 30} 件`);
  }
  if (errors.length > 0) {
    console.error(`\n❌ topic-catalog 検証: ${errors.length} 件の error`);
    console.error("   内訳:", tally(errors));
    for (const e of errors.slice(0, 50)) console.error("   " + e);
    if (errors.length > 50) console.error(`   … 他 ${errors.length - 50} 件`);
    console.error("   規約: packages/data-configs/src/topics/README.md");
    process.exit(1);
  }
  if (STRICT && warns.length > 0) {
    console.error(`\n❌ --strict: warn ${warns.length} 件を error 扱い`);
    process.exit(1);
  }
  console.log("✅ topic-catalog 検証: error なし");
  process.exit(0);
}

main();
