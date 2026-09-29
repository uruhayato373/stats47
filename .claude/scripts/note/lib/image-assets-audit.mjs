/**
 * note 原稿 (docs/31_note記事原稿) の画像資産契約を検査する純関数。
 *
 * 契約の正典は .claude/rules/note-image-assets.md。ここは判定だけを持ち、I/O は CLI が渡す。
 *   1. 再生成できる PNG (同名 SVG が追跡されている) を git に載せない
 *   2. 無視 (gitignore) されている PNG には再生成元の SVG が要る (無ければ実体を失う)
 *   3. ランキング記事 (a-<rankingKey>) は、記事で使ったデータを chart-data.json と
 *      data-provenance.json だけで復元できる形で持つ
 *   4. 追跡中 PNG の総量は縮小専用の予算を超えない
 */

import { NOTE_RANKING_IMAGES, validateRenderSpec } from "./note-render-spec.mjs";

export const DOCS31 = "docs/31_note記事原稿/";
export const RANKING_ARTICLE_POINTS = 47;
export const CODES = {
  DERIVED_PNG_TRACKED: "DERIVED_PNG_TRACKED",
  IGNORED_PNG_WITHOUT_SVG: "IGNORED_PNG_WITHOUT_SVG",
  RANKING_CHART_DATA_INVALID: "RANKING_CHART_DATA_INVALID",
  RANKING_PROVENANCE_INVALID: "RANKING_PROVENANCE_INVALID",
  TRACKED_PNG_OVER_BUDGET: "TRACKED_PNG_OVER_BUDGET",
  RENDER_SPEC_INVALID: "RENDER_SPEC_INVALID",
  NOTE_R2_BODY_MISSING: "NOTE_R2_BODY_MISSING",
  NOTE_BACKGROUND_MISSING: "NOTE_BACKGROUND_MISSING",
};

const isPng = (file) => /\.png$/i.test(file);
const svgSibling = (file) => file.replace(/\.png$/i, ".svg");
const articleSlug = (file) => file.slice(DOCS31.length).split("/")[0];

/** ランキング記事 (Aシリーズ単一指標)。家計 (a-kakei-*) は別の生成系なので含めない */
export function isRankingArticleSlug(slug) {
  return /^a-/.test(slug) && !/^a-kakei-/.test(slug);
}

const finite = (value) => typeof value === "number" && Number.isFinite(value);
const nonEmpty = (value) => typeof value === "string" && value.trim() !== "";

export function validateRankingChartData(slug, chartData) {
  const errors = [];
  const rankingKey = slug.slice(2);
  if (!chartData || typeof chartData !== "object") return ["chart-data.json を JSON オブジェクトとして読めない"];
  const meta = chartData._meta ?? {};
  if (meta.rankingKey !== rankingKey) errors.push(`_meta.rankingKey=${meta.rankingKey} が slug と不一致`);
  if (!(finite(meta.year) || nonEmpty(meta.year))) errors.push("_meta.year が無い");
  for (const key of ["canonicalTitle", "readerLabel", "hook"]) {
    if (!nonEmpty(chartData.copy?.[key])) errors.push(`copy.${key} が無い`);
  }
  // 画像の再描画に必要。無いと chart-data.json だけでは単位を復元できない
  if (typeof chartData.unit !== "string") errors.push("unit (文字列) が無い。単位が空の指標は空文字を明示する");
  for (const key of ["mean", "stddev", "topBottomRatio"]) {
    if (!finite(chartData.summary?.[key])) errors.push(`summary.${key} が数値でない`);
  }
  const rows = Array.isArray(chartData.data) ? chartData.data : [];
  if (rows.length !== RANKING_ARTICLE_POINTS) errors.push(`data が ${rows.length} 行 (47 行必要)`);
  else {
    if (new Set(rows.map((row) => row.area_code)).size !== RANKING_ARTICLE_POINTS) errors.push("area_code が 47 種類でない");
    const ranks = rows.map((row) => row.rank).sort((a, b) => a - b);
    if (ranks.some((rank, index) => rank !== index + 1)) errors.push("rank が 1..47 の連番でない");
    if (rows.some((row) => !finite(row.value))) errors.push("value が数値でない行がある");
    if (rows.some((row) => !nonEmpty(row.area_name))) errors.push("area_name が空の行がある");
    if (meta.year !== undefined && rows.some((row) => String(row.year) !== String(meta.year))) errors.push("行の year が _meta.year と不一致");
  }
  return errors;
}

export function validateRankingProvenance(slug, provenance, chartData) {
  const errors = [];
  const rankingKey = slug.slice(2);
  if (!provenance || typeof provenance !== "object") return ["data-provenance.json を JSON オブジェクトとして読めない"];
  if (provenance.slug !== slug) errors.push(`slug=${provenance.slug} が記事ディレクトリと不一致`);
  if (provenance.rankingKey !== rankingKey) errors.push(`rankingKey=${provenance.rankingKey} が不一致`);
  if (chartData?._meta && String(provenance.year) !== String(chartData._meta.year)) errors.push("year が chart-data.json と不一致");
  if (!nonEmpty(provenance.source) || !provenance.source.includes(`app/stats/${rankingKey}/values.json`)) {
    errors.push("source が R2 の values.json を指していない");
  }
  if (!nonEmpty(provenance.restore)) errors.push("restore (復元コマンド) が無い");
  return errors;
}

/**
 * @param {object} input
 * @param {string[]} input.tracked docs/31 配下の追跡ファイル (repo 相対)
 * @param {string[]} input.ignoredUntracked docs/31 配下の無視されている未追跡ファイル (作業ツリーのみ。CI では空)
 * @param {Map<string, number>} input.pngBytes 追跡中 PNG の容量
 * @param {(file: string) => unknown | null} input.readJson repo 相対パスの JSON (無い・壊れていれば null)
 * @param {{ trackedPngBytes?: number, trackedPngCount?: number } | null} input.budget
 */
export function auditImageAssets({ tracked, ignoredUntracked = [], pngBytes = new Map(), readJson, readText = () => null, budget = null }) {
  const findings = [];
  const add = (code, file, message) => findings.push({ code, file, message });
  const trackedSet = new Set(tracked);
  const pngs = tracked.filter(isPng);

  // ランキング記事の 4 枚は、追跡された render-spec.json + chart-data.json から作り直せる (SVG は要らない)
  const renderableFromSpec = (file) => {
    const slug = articleSlug(file);
    if (!isRankingArticleSlug(slug)) return false;
    const dir = `${DOCS31}${slug}/`;
    return trackedSet.has(`${dir}render-spec.json`) && trackedSet.has(`${dir}chart-data.json`) && NOTE_RANKING_IMAGES.some((image) => dir + image.file === file);
  };
  const regenerable = (file) => trackedSet.has(svgSibling(file)) || renderableFromSpec(file);

  for (const file of pngs) {
    if (trackedSet.has(svgSibling(file))) add(CODES.DERIVED_PNG_TRACKED, file, `${svgSibling(file).split("/").pop()} から再生成できる。PNG を追跡しない`);
    else if (renderableFromSpec(file)) add(CODES.DERIVED_PNG_TRACKED, file, "render-spec.json と chart-data.json から再生成できる (render-ranking-images.mjs)。PNG を追跡しない");
  }

  for (const file of ignoredUntracked.filter(isPng)) {
    if (!regenerable(file)) add(CODES.IGNORED_PNG_WITHOUT_SVG, file, "gitignore された PNG に再生成元 (同名 SVG、またはランキング記事の render-spec.json) が無い。git に載らず失われる");
  }

  const slugs = [...new Set(tracked.map(articleSlug))].filter(isRankingArticleSlug);
  let rankingArticles = 0;
  for (const slug of slugs) {
    const dir = `${DOCS31}${slug}`;
    if (!trackedSet.has(`${dir}/chart-data.json`) && !trackedSet.has(`${dir}/draft.md`)) continue;
    rankingArticles += 1;
    const chartData = readJson(`${dir}/chart-data.json`);
    const provenance = readJson(`${dir}/data-provenance.json`);
    for (const message of validateRankingChartData(slug, chartData)) add(CODES.RANKING_CHART_DATA_INVALID, `${dir}/chart-data.json`, message);
    // 画像を作り直せる根拠。chart-data.json の SHA とテンプレート版が現行と一致していること
    const specText = readText(`${dir}/render-spec.json`);
    if (specText === null) add(CODES.RENDER_SPEC_INVALID, `${dir}/render-spec.json`, "render-spec.json が無い。node .claude/scripts/note/render-ranking-images.mjs で作る");
    else {
      let spec = null;
      try {
        spec = JSON.parse(specText);
      } catch {
        /* validateRenderSpec が読めない旨を返す */
      }
      for (const message of validateRenderSpec(slug, spec, readText(`${dir}/chart-data.json`))) add(CODES.RENDER_SPEC_INVALID, `${dir}/render-spec.json`, message);
    }
    for (const message of validateRankingProvenance(slug, provenance, chartData)) add(CODES.RANKING_PROVENANCE_INVALID, `${dir}/data-provenance.json`, message);
  }

  const trackedPngBytes = pngs.reduce((sum, file) => sum + (pngBytes.get(file) ?? 0), 0);
  if (budget) {
    if (finite(budget.trackedPngBytes) && trackedPngBytes > budget.trackedPngBytes) {
      add(CODES.TRACKED_PNG_OVER_BUDGET, DOCS31, `追跡中 PNG が ${trackedPngBytes} bytes で予算 ${budget.trackedPngBytes} bytes を超えた`);
    }
    if (finite(budget.trackedPngCount) && pngs.length > budget.trackedPngCount) {
      add(CODES.TRACKED_PNG_OVER_BUDGET, DOCS31, `追跡中 PNG が ${pngs.length} 枚で予算 ${budget.trackedPngCount} 枚を超えた`);
    }
  }

  // 再生成元を持たない追跡 PNG の内訳。ここが「実体を git が唯一保持している画像」
  const sourceless = pngs.filter((file) => !regenerable(file));
  const sourcelessByClass = {};
  for (const file of sourceless) {
    const slug = articleSlug(file);
    const cls = isRankingArticleSlug(slug) ? "ranking-article" : slug.startsWith("product-") ? "product-sales" : "other";
    sourcelessByClass[cls] = (sourcelessByClass[cls] ?? 0) + 1;
  }

  return {
    findings,
    summary: {
      trackedPngCount: pngs.length,
      trackedPngBytes,
      derivedPngTracked: findings.filter((f) => f.code === CODES.DERIVED_PNG_TRACKED).length,
      sourcelessTrackedPng: sourceless.length,
      sourcelessByClass,
      rankingArticles,
      rankingArticlesInvalid: new Set(findings.filter((f) => f.code.startsWith("RANKING_") || f.code === CODES.RENDER_SPEC_INVALID).map((f) => f.file.split("/")[2])).size,
    },
  };
}

/**
 * カタログが「R2 に本文がある (r2_body)」と言う記事が、実際に R2 にあるかを突き合わせる (ネットワーク要・週次のみ)。
 * 2026-09-29 の実測で、r2_body:true の a-* 14 本が R2 に無く、git の docs/31 が唯一の実体だった。
 * この状態で「r2_body:true だから docs/31 を消してよい」と判断すると原稿が失われる。
 *
 * @param {Record<string, {r2_body?: boolean, r2_path?: string, is_paid?: boolean}>} articles note-published-urls.json の articles
 * @param {Map<string, number>} statusByPath r2_path -> draft.md の HTTP status (取得失敗は 0)
 * @param {string[]} known 既知の欠落 slug (縮小専用。ここに無い欠落だけを新規違反とする)
 */
export function auditR2BodyPresence(articles, statusByPath, known = []) {
  const findings = [];
  const unknown = [];
  let checked = 0;
  for (const [slug, article] of Object.entries(articles)) {
    if (!article.r2_body || !article.r2_path || article.is_paid) continue;
    checked += 1;
    const status = statusByPath.get(article.r2_path);
    if (status === 200) continue;
    if (!status) {
      unknown.push(slug);
      continue;
    }
    if (!known.includes(slug)) findings.push({ code: CODES.NOTE_R2_BODY_MISSING, file: article.r2_path, message: `r2_body:true だが R2 の draft.md が HTTP ${status}。docs/31 (git) が唯一の実体の可能性` });
  }
  return { findings, unknown, checked };
}

/**
 * render-spec.json の background (生成 AI の背景) が R2 に実在するかを突き合わせる (ネットワーク要・週次のみ)。
 * 背景は作り直せない入力なので、R2 に無いと画像を作り直せず、その記事は永久に更新できなくなる。
 * @param {Array<{slug: string, r2Key: string}>} backgrounds spec の background を持つ記事
 * @param {Map<string, number>} statusByKey r2Key -> HTTP status (取得失敗は 0)
 */
export function auditBackgroundPresence(backgrounds, statusByKey) {
  const findings = [];
  const unknown = [];
  for (const { slug, r2Key } of backgrounds) {
    const status = statusByKey.get(r2Key);
    if (status === 200) continue;
    if (!status) unknown.push(slug);
    else findings.push({ code: CODES.NOTE_BACKGROUND_MISSING, file: r2Key, message: `${slug} の生成 AI 背景が R2 に無い (HTTP ${status})。作り直せない入力なので、Drive の候補から ingest-note-background.mjs → R2 反映が要る` });
  }
  return { findings, unknown, checked: backgrounds.length };
}
