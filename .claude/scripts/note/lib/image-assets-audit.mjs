/**
 * note 記事の画像・データ資産の契約を検査する純関数。
 *
 * 契約の正典は .claude/rules/note-image-assets.md。ここは判定だけを持ち、I/O は CLI が渡す。
 *   1. docs/31_note記事原稿 は作業場で、git に何も置かない (本文・画像の正本は R2、所在は data/note/articles.json)
 *   2. ランキング記事 (a-<rankingKey>) は、記事で使ったデータを chart-data.json と
 *      data-provenance.json だけで復元できる形で持つ (note:article save が保存前に警告する)
 *   3. 台帳が R2 に保存済みとする公開本文が実在する / 生成 AI の背景が R2 に実在する (週次)
 */

import { validateRenderSpec } from "./note-render-spec.mjs";

export const DOCS31 = "docs/31_note記事原稿/";
export const RANKING_ARTICLE_POINTS = 47;
export const CODES = {
  DOCS31_TRACKED: "DOCS31_TRACKED",
  RANKING_CHART_DATA_INVALID: "RANKING_CHART_DATA_INVALID",
  RANKING_PROVENANCE_INVALID: "RANKING_PROVENANCE_INVALID",
  RENDER_SPEC_INVALID: "RENDER_SPEC_INVALID",
  NOTE_R2_BODY_MISSING: "NOTE_R2_BODY_MISSING",
  NOTE_BACKGROUND_MISSING: "NOTE_BACKGROUND_MISSING",
};


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
/** docs/31 に作業場の説明 README.md 以外の追跡ファイルがあれば違反 (作業コピーは gitignore 済みで、正本は R2)。 */
export const DOCS31_README = `${DOCS31}README.md`;

export function auditImageAssets({ tracked }) {
  const findings = tracked.filter((file) => file !== DOCS31_README).map((file) => ({
    code: CODES.DOCS31_TRACKED,
    file,
    message: "docs/31 は作業場で git に置かない。npm run note:article -- save <key> で R2 へ保存し、git rm --cached で外す",
  }));
  return { findings, summary: { docs31Tracked: findings.length } };
}

/**
 * ランキング記事の作業コピーを保存する前の検査。readText(name) は記事ディレクトリ内の相対名で中身 (無ければ null) を返す。
 * @returns {{code: string, file: string, message: string}[]}
 */
export function validateRankingArticleFiles(slug, readText) {
  if (!isRankingArticleSlug(slug)) return [];
  const findings = [];
  const add = (code, file, message) => findings.push({ code, file: `${slug}/${file}`, message });
  const parse = (text) => {
    try {
      return text === null ? null : JSON.parse(text);
    } catch {
      return null;
    }
  };
  const chartText = readText("chart-data.json");
  const chartData = parse(chartText);
  for (const message of validateRankingChartData(slug, chartData)) add(CODES.RANKING_CHART_DATA_INVALID, "chart-data.json", message);
  const specText = readText("render-spec.json");
  if (specText === null) add(CODES.RENDER_SPEC_INVALID, "render-spec.json", "render-spec.json が無い。node .claude/scripts/note/render-ranking-images.mjs で作る");
  else for (const message of validateRenderSpec(slug, parse(specText), chartText)) add(CODES.RENDER_SPEC_INVALID, "render-spec.json", message);
  for (const message of validateRankingProvenance(slug, parse(readText("data-provenance.json")), chartData))
    add(CODES.RANKING_PROVENANCE_INVALID, "data-provenance.json", message);
  return findings;
}

/**
 * 台帳 (data/note/articles.json) が公開 R2 に保存済みとする本文が、実際に配信されているかを突き合わせる (ネットワーク要・週次)。
 * 公開済みなのに本文を一度も保存していない記事 (note のみの回収待ちを除く) も違反にする。
 *
 * @param {Array<{key: string, status: string, r2Path: string, body: {store: string, manifest: object|null}}>} articles
 * @param {Map<string, number>} statusByPath r2Path -> draft.md の HTTP status (取得失敗は 0)
 */
export function auditR2BodyPresence(articles, statusByPath) {
  const findings = [];
  const unknown = [];
  let checked = 0;
  for (const article of articles) {
    if (article.body.store === "note-only") continue;
    if (!article.body.manifest) {
      if (article.status === "published")
        findings.push({ code: CODES.NOTE_R2_BODY_MISSING, file: article.r2Path, message: `${article.key}: 公開済みなのに本文が R2 に未保存 (台帳の body.manifest が null)` });
      continue;
    }
    if (article.body.store !== "r2-public") continue;
    checked += 1;
    const status = statusByPath.get(article.r2Path);
    if (status === 200) continue;
    if (!status) unknown.push(article.key);
    else findings.push({ code: CODES.NOTE_R2_BODY_MISSING, file: article.r2Path, message: `${article.key}: 台帳は保存済みだが公開 R2 の draft.md が HTTP ${status}` });
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
