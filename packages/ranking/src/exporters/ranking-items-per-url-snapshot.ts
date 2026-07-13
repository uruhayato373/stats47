import "server-only";

import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { generateMiniTileSvg } from "@stats47/visualization/server";

import surveysMaster from "../data/surveys.json";
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
  const featuredItems = items
    .filter((it) => it.isFeatured && it.isActive && it.areaType === "prefecture")
    .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));

  // 各 featured item に「1 位」表示とミニタイルマップ SVG を焼き込む。
  // トップページ (`<FeaturedRankings>`) がランタイムで values.json を都度フェッチして
  // SVG を生成する代わりに、ここ (ビルド時・1 回) で計算して snapshot に載せる
  // (Derived → R2 snapshot の完全DBレス方針。値なし item はフィールド未設定のまま返し、
  //  コンポーネント側の後方互換フォールバックに委ねる)。
  const featuredBaked: FeaturedRankingItem[] = await Promise.all(
    featuredItems.map(async (item): Promise<FeaturedRankingItem> => {
      const yearCode =
        item.availableYears?.[0]?.yearCode || item.latestYear?.yearCode || "2024";
      const valuesResult = await readRankingValuesFromR2(
        item.rankingKey,
        "prefecture",
        yearCode,
      );
      if (!valuesResult.success || valuesResult.data.length === 0) {
        return { ...item };
      }
      const values = valuesResult.data;
      const top = values.find((v) => v.rank === 1);
      const featuredTop = top
        ? {
            areaName: top.areaName,
            value: top.value !== null ? top.value.toLocaleString("ja-JP") : null,
          }
        : null;
      const tileMapSvg = generateMiniTileSvg(
        values.flatMap((v) =>
          v.value !== null
            ? [{ areaCode: v.areaCode, value: v.value, rank: v.rank ?? undefined }]
            : [],
        ),
        item.visualization?.colorScheme,
        item.visualization?.isReversed,
        item.rankingKey,
      );
      return { ...item, featuredTop, tileMapSvg };
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
      .sort((a, b) => {
        const fa = a.featuredOrder ?? 0;
        const fb = b.featuredOrder ?? 0;
        if (fa !== fb) return fa - fb;
        return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      });

    const categoryItems: CategoryRankingItemWithAreaType[] = matched.map((r) => ({
      rankingKey: r.rankingKey,
      areaType: r.areaType,
      title: r.title,
      subtitle: r.subtitle ?? null,
      unit: r.unit,
      latestYear: r.latestYear ?? null,
      availableYears: r.availableYears ?? null,
      description: r.description ?? null,
      demographicAttr: r.demographicAttr ?? null,
      normalizationBasis: r.normalizationBasis ?? null,
      groupKey: r.groupKey ?? null,
      isFeatured: r.isFeatured ?? false,
    }));

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
    // SSDS の baked surveyId は誤りが多いため param から解決した attribution を焼き込む。
    const attribution = resolveItemAttribution(item);
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
      .sort((a, b) => {
        const fa = a.featuredOrder ?? 0;
        const fb = b.featuredOrder ?? 0;
        if (fa !== fb) return fa - fb;
        return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      });

    const surveyItems: CategoryRankingItemWithAreaType[] = matched.map((r) => ({
      rankingKey: r.rankingKey,
      areaType: r.areaType,
      title: r.title,
      subtitle: r.subtitle ?? null,
      unit: r.unit,
      latestYear: r.latestYear ?? null,
      availableYears: r.availableYears ?? null,
      description: r.description ?? null,
      demographicAttr: r.demographicAttr ?? null,
      normalizationBasis: r.normalizationBasis ?? null,
      groupKey: r.groupKey ?? null,
      isFeatured: r.isFeatured ?? false,
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
      home: featuredItems.length,
      categories: { count: categoriesCount, files: categoriesFiles },
      items: { count: items.length, files: itemsFiles },
      surveys: { count: surveysCount, files: surveysFiles },
      totalSizeBytes,
      durationMs,
    },
    "ranking_items per-URL snapshots を R2 に保存しました",
  );

  return {
    home: { count: featuredItems.length },
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
