import "server-only";

import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import {
  generateRankingThumbnailMapSvg,
} from "@stats47/visualization/server";

import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import {
  CATEGORY_TOPIC_CATALOGS,
  OTHER_TOPIC_KEY,
  OTHER_TOPIC_LABEL,
  resolveTopicKey,
  toTopicResolutionInput,
  type CategoryTopicCatalog,
} from "@stats47/data-configs/topics";

import surveysMaster from "../data/surveys.json";

/** categoryKey は string なので、レジストリ側の Partial<Record<CategoryKey, …>> を安全に引く */
function lookupTopicCatalog(categoryKey: string) {
  return (CATEGORY_TOPIC_CATALOGS as Record<string, CategoryTopicCatalog | undefined>)[
    categoryKey
  ];
}
import { KNOWN_RANKING_KEYS } from "../config/known-ranking-keys";
import { compareByRepresentativeThenRecency } from "../lib/ranking-order";
import { bakeHomeFeaturedItem, resolveHomeFeaturedItems } from "./home-featured";
import { listRankingItemsWithTagsFromR2 } from "../repositories/ranking-item";
import { readRankingValuesFromR2 } from "../repositories/ranking-value";
import type { CategoryRankingItem } from "../types/ranking-item";
import type { FeaturedRankingItem, RankingItem } from "../types/ranking-item";
import {
  categoryItemsKeyPath,
  homeFeaturedKeyPath,
  rankingItemKeyPath,
  surveyItemsKeyPath,
} from "../types/snapshot";
import {
  resolveItemAttribution,
  resolveItemOriginalSurveys,
  surveyBucketsForItem,
} from "./survey-bucketing";

/** CategoryRankingItem に areaType を追加したローカル型 */
interface CategoryRankingItemWithAreaType extends CategoryRankingItem {
  areaType: string;
  /** 出典 (原典調査) survey id 群。survey バケット由来でのみ付与。 */
  originalSurveys?: string[];
}

export interface ExportRankingItemsPerUrlResult {
  home: { count: number };
  categories: { count: number; files: number };
  items: { count: number; files: number };
  surveys: { count: number; files: number };
  /**
   * items.json を生成した survey id 群 (= `app/survey/{id}/items.json` が存在する survey)。
   * surveys snapshot (app/survey/all.json) をこの集合に絞り込むことで、関連ランキングが
   * 0 件の orphan survey を一覧・サイドバー・generateStaticParams から排除する
   * (詳細ページが notFound() になるリンクを出さない)。
   */
  surveyIds: string[];
  /** survey id → 紐付く item 件数。surveys snapshot (all.json) の itemCount 焼き込みに使う */
  surveyItemCounts: Record<string, number>;
  totalSizeBytes: number;
  durationMs: number;
}

/**
 * exportRankingItemsPerUrl の fail-closed 事前検査 (pure・unit test 対象)。
 *
 * 2026-07-27 障害の再発防止: `enumerateRankingItemKeys` (read-ranking-items-snapshot.ts) の
 * R2 list が部分的な staging (item-metadata-refresh --apply が差分パッチした一部だけ) を
 * 「listing が 0 件超だから全件」と誤認し、home/featured.json 等が count:0 で R2 に
 * 上書きされた。ここで items 件数・home featured 解決の 2 点を検査し、異常なら
 * errors を返す (呼び出し元はこれを見て throw する)。
 */
export function checkRankingItemsCompleteness(input: {
  /** listRankingItemsWithTagsFromR2 が読めた item 数 */
  itemCount: number;
  /** 期待する最低件数 (通常 KNOWN_RANKING_KEYS.size の 90%) */
  expectedMinCount: number;
  /** resolveHomeFeaturedItems が解決できなかった rankingKey (本来 0 件のはず) */
  missingFeaturedKeys: readonly string[];
}): string[] {
  const errors: string[] = [];
  if (input.missingFeaturedKeys.length > 0) {
    errors.push(
      `home featured: item.json に解決できない定義があります (${input.missingFeaturedKeys.join(", ")})`,
    );
  }
  if (input.itemCount < input.expectedMinCount) {
    errors.push(
      `item.json 読み込み件数が異常に少ない (items=${input.itemCount}, expected>=${input.expectedMinCount})。` +
        `R2 の部分列挙 (item-metadata-refresh staging 等) を全件と誤認している可能性があります ` +
        `(NODE_ENV=production で S3 API 経由の一覧を使っているか確認してください)`,
    );
  }
  return errors;
}

/**
 * URL 単位の小さい JSON を R2 に生成・保存する (完全DBレス: docs/01_技術設計/19)。
 *
 * SSOT は R2 の per-key `app/ranking/<key>/item.json`
 * (listRankingItemsWithTagsFromR2)。item.json から全 RankingItem を読み、URL 単位の
 * 派生 snapshot (home/category/survey) を再グループ化して書き出す。
 * ※ enumeration に R2 list が要るため SSD 接続 or S3 認証下で実行すること
 *   (公開URL専用環境では基盤1 fallback が prefecture のみになり city/port を取りこぼす)。
 * ※ 本 exporter は item.json を再グループ化するのみ (seo フィールドは patch しない)。
 *   config (git TS) → item.json の seoTitle/seoDescription 反映は
 *   `refreshRankingItemSeoFields` (ranking-item-seo-refresh.ts, Q-DESIGN R0) が担う。
 *   sync-snapshots では master (本 exporter) → item-seo-refresh の順で実行する。
 *   新規 metric の item.json 初期生成は別途フローが要る (未整備)。
 *
 * 生成ファイル:
 *   home/featured.json
 *   category/{categoryKey}/items.json
 *   ranking/{rankingKey}/item.json
 *   survey/{surveyId}/items.json
 */
export async function exportRankingItemsPerUrl(): Promise<ExportRankingItemsPerUrlResult> {
  const startedAt = Date.now();

  // 1. 全 ranking item を R2 item.json から取得
  const itemsResult = await listRankingItemsWithTagsFromR2();
  if (!itemsResult.success) {
    throw itemsResult.error ?? new Error("listRankingItemsWithTagsFromR2 failed");
  }
  const items: RankingItem[] = itemsResult.data;

  // 2. categoryKey の列挙 (categoryKey + additionalCategories の union)
  const categoryKeySet = new Set<string>();
  for (const item of items) {
    if (item.categoryKey) categoryKeySet.add(item.categoryKey);
    if (Array.isArray(item.additionalCategories)) {
      for (const ck of item.additionalCategories) {
        categoryKeySet.add(ck);
      }
    }
  }

  // 3. survey バケットの構築。SSDS 由来 item は cdCat01 から原典 survey を解決して再分配し
  //    (62.9% が誤分類だった旧 baked surveyId を是正)、非SSDS は baked surveyId を維持する。
  //    1 pass で surveyId → 該当 active item[] を組む (バケット loop で再 filter しない)。
  const itemsBySurvey = new Map<string, RankingItem[]>();
  for (const item of items) {
    if (!item.isActive) continue;
    for (const surveyId of surveyBucketsForItem(item)) {
      const arr = itemsBySurvey.get(surveyId);
      if (arr) arr.push(item);
      else itemsBySurvey.set(surveyId, [item]);
    }
  }
  const surveyIdSet = new Set(itemsBySurvey.keys());

  const generatedAt = new Date().toISOString();
  const uploads: Promise<{ key: string; size: number }>[] = [];

  // ── home/featured.json ──────────────────────────────────────────────────────
  // ホームの選定・順番・hookは掲載価値スコアの生成物 `HOME_FEATURED_PROMINENCE` が決める
  // (2026-07-29 に手動キュレーション HOME_FEATURED_RANKINGS から自動選定へ移行)。
  // 生成物は isActive な metric からしか選ばないので、旧 config validation は不要。
  const { resolved: featuredResolved, missingKeys } = resolveHomeFeaturedItems(items);
  const completenessErrors = checkRankingItemsCompleteness({
    itemCount: items.length,
    expectedMinCount: Math.floor(KNOWN_RANKING_KEYS.size * 0.9),
    missingFeaturedKeys: missingKeys,
  });
  if (completenessErrors.length > 0) {
    throw new Error(
      `exportRankingItemsPerUrl completeness check failed: ${completenessErrors.join(" / ")}`,
    );
  }

  // 各itemに1位 + 共通都道府県地図SVG + homeFeatured (hook) を焼き込む。
  // トップページ (`<FeaturedRankings>`) がランタイムで values.json を都度フェッチして
  // SVG を生成する代わりに、ここ (ビルド時・1 指標 1 回の values read) で計算して snapshot に
  // 載せる (Derived → R2 snapshot の完全DBレス方針。値なし item は派生値なしのまま返し、
  //  コンポーネント側でカードを非表示にする)。派生ロジックはpure helper
  //  (home-featured.ts) にあり fixture で unit test される。
  const featuredBaked: FeaturedRankingItem[] = await Promise.all(
    featuredResolved.map(async ({ item, definition }): Promise<FeaturedRankingItem> => {
      const yearCode =
        item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024";
      const valuesResult = await readRankingValuesFromR2(
        item.rankingKey,
        "prefecture",
        yearCode,
      );
      if (!valuesResult.success || valuesResult.data.length === 0) {
        // 値が読めない場合もhomeFeatured (hook) は焼く
        return {
          ...item,
          homeFeatured: {
            order: definition.order,
            hook: definition.hook,
          },
        };
      }
      return bakeHomeFeaturedItem({
        item,
        definition,
        values: valuesResult.data,
        generateSvg: (rows) =>
          generateRankingThumbnailMapSvg(rows, {
            colorScheme: item.visualization?.colorScheme,
            isReversed: item.visualization?.isReversed,
            idSuffix: item.rankingKey,
          }),
      });
    }),
  );

  const featuredBody = JSON.stringify({
    generatedAt,
    count: featuredBaked.length,
    items: featuredBaked,
  });
  uploads.push(
    saveToR2(homeFeaturedKeyPath(), featuredBody, {
      contentType: "application/json; charset=utf-8",
    }),
  );

  // ── category/{categoryKey}/items.json ────────────────────────────────────────
  // カテゴリページのサイドバー「この統計の出典調査」用に、そのカテゴリの active item の
  // 出典調査 (survey バケットと同じ導出・マスタ実在のみ) を集計して焼き込む。
  // 旧実装はページ側が全調査リスト (app/survey/all.json) を表示しており、無関係な調査が
  // 並んでいた (2026-07-14 是正。正典: survey-linkage-standards.md §2)。
  const surveyNameById = new Map(
    (surveysMaster as Array<{ id: string; name: string }>).map((s) => [s.id, s.name]),
  );
  for (const categoryKey of categoryKeySet) {
    const matched = items
      .filter((it) => {
        if (!it.isActive) return false;
        if (it.categoryKey === categoryKey) return true;
        if (Array.isArray(it.additionalCategories)) {
          return it.additionalCategories.includes(categoryKey);
        }
        return false;
      })
      .sort(compareByRepresentativeThenRecency);

    // カテゴリ内グループ (topic) の解決。カタログ未登録カテゴリでは焼かない
    // (UI は topics マニフェストの有無で平坦一覧へ縮退する)。
    // 同じ metric が additionalCategories 経由で複数カテゴリに出るため、
    // topic は item 単体ではなく **category 文脈ごと**に解決する。
    const topicCatalog = lookupTopicCatalog(categoryKey);
    const topicKeyByRankingKey = new Map<string, string>();
    const usedTopicKeys = new Set<string>();
    if (topicCatalog) {
      for (const r of matched) {
        const config = METRICS_REGISTRY[r.rankingKey];
        if (!config) continue; // registry に無い (退役直後等) は分類しない
        const topicKey = resolveTopicKey(toTopicResolutionInput(config), topicCatalog);
        topicKeyByRankingKey.set(r.rankingKey, topicKey);
        usedTopicKeys.add(topicKey);
      }
    }

    const categoryItems: CategoryRankingItemWithAreaType[] = matched.map((r) => ({
      rankingKey: r.rankingKey,
      areaType: r.areaType,
      title: r.title,
      readerLabel: r.readerLabel ?? r.title,
      subtitle: r.subtitle ?? null,
      unit: r.unit,
      latestYear: r.latestYear ?? null,
      availableYears: r.availableYears ?? null,
      description: r.description ?? null,
      demographicAttr: r.demographicAttr ?? null,
      normalizationBasis: r.normalizationBasis ?? null,
      groupKey: r.groupKey ?? null,
      hook: r.hook ?? null,
      top1: r.latestTop ?? null,
      ...(topicCatalog ? { topicKey: topicKeyByRankingKey.get(r.rankingKey) ?? null } : {}),
    }));

    // 表示順マニフェスト。1 件以上該当した topic だけをカタログ順に並べ、
    // 受け皿 (other) は該当があれば末尾に付ける。
    const topics = topicCatalog
      ? [
          ...topicCatalog.topics
            .filter((topic) => usedTopicKeys.has(topic.key))
            .map((topic) => ({ key: topic.key, label: topic.label })),
          ...(usedTopicKeys.has(OTHER_TOPIC_KEY)
            ? [{ key: OTHER_TOPIC_KEY, label: OTHER_TOPIC_LABEL }]
            : []),
        ]
      : undefined;

    const sourceSurveyCounts = new Map<string, number>();
    for (const it of matched) {
      for (const surveyId of surveyBucketsForItem(it)) {
        if (!surveyNameById.has(surveyId)) continue; // マスタ非実在 (合成 id 等) はリンクを出さない
        sourceSurveyCounts.set(surveyId, (sourceSurveyCounts.get(surveyId) ?? 0) + 1);
      }
    }
    const sourceSurveys = [...sourceSurveyCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, itemCount]) => ({ id, name: surveyNameById.get(id)!, itemCount }));

    const body = JSON.stringify({
      generatedAt,
      categoryKey,
      count: categoryItems.length,
      items: categoryItems,
      sourceSurveys,
      ...(topics ? { topics } : {}),
    });
    uploads.push(
      saveToR2(categoryItemsKeyPath(categoryKey), body, {
        contentType: "application/json; charset=utf-8",
      }),
    );
  }

  // ── ranking/{rankingKey}/item.json ───────────────────────────────────────────
  // Group by rankingKey (a rankingKey may span multiple areaTypes → array)
  const byRankingKey = new Map<string, RankingItem[]>();
  for (const item of items) {
    const existing = byRankingKey.get(item.rankingKey);
    if (existing) {
      existing.push(item);
    } else {
      byRankingKey.set(item.rankingKey, [item]);
    }
  }

  for (const [rankingKey, keyItems] of byRankingKey) {
    // Use the first item as the canonical item for the file
    const item = keyItems[0];
    // 出典表記 (2 階層: 編成統計 + 原典調査)。ranking 詳細ページが統一表示に使う。
    // SSDS の baked surveyId は誤りが多いため param から解決した attribution を使う。
    // ★builder が焼いた値があればそれを尊重する (書き手を 1 つにするため。
    //   builder 側が焼かなかった stale item への安全網としてのみ再解決する)。
    const attribution = item.attribution ?? resolveItemAttribution(item);
    const body = JSON.stringify({
      generatedAt,
      item: { ...item, attribution },
    });
    uploads.push(
      saveToR2(rankingItemKeyPath(rankingKey), body, {
        contentType: "application/json; charset=utf-8",
      }),
    );
  }

  // ── survey/{surveyId}/items.json ─────────────────────────────────────────────
  for (const surveyId of surveyIdSet) {
    const matched = (itemsBySurvey.get(surveyId) ?? [])
      .slice()
      .sort(compareByRepresentativeThenRecency);

    const surveyItems: CategoryRankingItemWithAreaType[] = matched.map((r) => ({
      rankingKey: r.rankingKey,
      areaType: r.areaType,
      title: r.title,
      readerLabel: r.readerLabel ?? r.title,
      subtitle: r.subtitle ?? null,
      unit: r.unit,
      latestYear: r.latestYear ?? null,
      availableYears: r.availableYears ?? null,
      description: r.description ?? null,
      demographicAttr: r.demographicAttr ?? null,
      normalizationBasis: r.normalizationBasis ?? null,
      groupKey: r.groupKey ?? null,
      hook: r.hook ?? null,
      top1: r.latestTop ?? null,
      // survey ページの広告 vertical 導出に使う (調査主題と広告を連動させる)。
      categoryKey: r.categoryKey ?? null,
      // 出典 (原典調査)。UI が「出典: ◯◯調査」表示に使う。SSDS は複数原典あり。
      // builder 焼き込み済み surveyIds を優先し、stale item は従来解決 (SSDS のみ) にフォールバック。
      originalSurveys:
        r.surveyIds ?? resolveItemOriginalSurveys(r).map((s) => s.id),
    }));

    const body = JSON.stringify({
      generatedAt,
      surveyId,
      count: surveyItems.length,
      items: surveyItems,
    });
    uploads.push(
      saveToR2(surveyItemsKeyPath(surveyId), body, {
        contentType: "application/json; charset=utf-8",
      }),
    );
  }

  // 4. 並列アップロード
  const results = await Promise.all(uploads);
  const totalSizeBytes = results.reduce((sum, r) => sum + r.size, 0);
  const durationMs = Date.now() - startedAt;

  const categoriesFiles = categoryKeySet.size;
  const itemsFiles = byRankingKey.size;
  const surveysFiles = surveyIdSet.size;

  // category アイテム数合計（全カテゴリの matched 合計は重複あるため items.length を代替とする）
  const categoriesCount = items.filter((it) => it.isActive && it.categoryKey).length;
  const surveysCount = items.filter((it) => it.isActive && it.surveyId).length;

  logger.info(
    {
      home: featuredBaked.length,
      categories: { count: categoriesCount, files: categoriesFiles },
      items: { count: items.length, files: itemsFiles },
      surveys: { count: surveysCount, files: surveysFiles },
      totalSizeBytes,
      durationMs,
    },
    "ranking_items per-URL snapshots を R2 に保存しました",
  );

  return {
    home: { count: featuredBaked.length },
    categories: { count: categoriesCount, files: categoriesFiles },
    items: { count: items.length, files: itemsFiles },
    surveys: { count: surveysCount, files: surveysFiles },
    surveyIds: [...surveyIdSet],
    surveyItemCounts: Object.fromEntries(
      [...itemsBySurvey.entries()].map(([id, arr]) => [id, arr.length]),
    ),
    totalSizeBytes,
    durationMs,
  };
}
