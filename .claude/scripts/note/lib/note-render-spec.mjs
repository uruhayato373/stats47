/**
 * ランキング note 記事の画像 4 枚の「作り方」の正典。
 * 画像は chart-data.json (記事で使ったデータ) とここの定義だけから作り直せる。契約: .claude/rules/note-image-assets.md
 *
 * テンプレート (apps/remotion/src/features/ranking-note/) の見た目を変えたら、必ず TEMPLATE_VERSION を上げる。
 * 上げると全記事の render-spec.json が古くなり、監査 (RENDER_SPEC_STALE) が「作り直し」を要求する。
 */
import { createHash } from "node:crypto";

export const NOTE_RENDER_TEMPLATE_VERSION = "2026-09-29.6";
export const NOTE_RENDER_PALETTE = "interpolateYlGnBu";
export const NOTE_RENDER_SCHEMA_VERSION = 1;

/** file は記事ディレクトリからの相対パス。名前は draft.md・publish-note が参照するので変えない */
export const NOTE_RANKING_IMAGES = [
  { file: "images/cover-1280x670.png", composition: "RankingNote-Cover", width: 1280, height: 670 },
  { file: "images/choropleth-map-1080x1080.png", composition: "RankingNote-ChoroplethMap", width: 1080, height: 1080 },
  { file: "images/chart-x-1200x630.png", composition: "RankingNote-Chart", width: 1200, height: 630 },
  { file: "images/boxplot-1200x630.png", composition: "RankingNote-Boxplot", width: 1200, height: 630 },
];

export const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/**
 * 生成 AI (imagegen / Codex) の背景。決定的に作り直せないので、作り方ではなく「入力」として保管し、SHA で固定する。
 * 置き場は二層: 候補・元画像は Drive `stats47/note画像/<slug>/candidates/` (非公開)、採用した最終版は R2 (下記 r2Key)。
 * タイトル・数値・地図は実テキスト/実データで重ね、生成 AI に焼き込ませない。
 */
export const NOTE_BACKGROUND_WIDTH = 1280;
export const NOTE_BACKGROUND_HEIGHT = 670;
export const noteBackgroundR2Key = (slug, sha) => `media/note-backgrounds/${slug}/${sha.slice(0, 12)}/background.jpg`;

/** background ブロックの検査。問題の文言を返す (空なら有効) */
export function validateBackground(slug, background) {
  if (background === undefined) return [];
  if (!background || typeof background !== "object") return ["background がオブジェクトでない"];
  const errors = [];
  if (background.status !== "approved") errors.push(`background.status=${background.status} (承認済み "approved" だけを spec に入れる)`);
  if (!/^[a-f0-9]{64}$/.test(background.sha256 ?? "")) errors.push("background.sha256 が 64 桁の 16 進でない");
  else if (background.r2Key !== noteBackgroundR2Key(slug, background.sha256)) errors.push(`background.r2Key が ${noteBackgroundR2Key(slug, background.sha256)} と不一致`);
  if (background.width !== NOTE_BACKGROUND_WIDTH || background.height !== NOTE_BACKGROUND_HEIGHT) {
    errors.push(`background の寸法 ${background.width}x${background.height} (期待 ${NOTE_BACKGROUND_WIDTH}x${NOTE_BACKGROUND_HEIGHT})`);
  }
  if (!Number.isInteger(background.bytes) || background.bytes <= 0) errors.push("background.bytes が正の整数でない");
  if (typeof background.model !== "string" || !background.model.trim()) errors.push("background.model が無い (どのモデルで作ったか)");
  if (typeof background.prompt !== "string" || !background.prompt.trim()) errors.push("background.prompt が無い (再生成・監査のため指示文を残す)");
  return errors;
}

/** chart-data.json (文字列) から Remotion の props を作る。データ・表示名・単位はここを通る値だけを使う */
export function buildRenderProps(chartData, backgroundImage) {
  const { _meta, copy, unit, summary, data } = chartData;
  return {
    ...(backgroundImage ? { backgroundImage } : {}),
    theme: "light",
    displayTitle: copy.readerLabel,
    hookText: copy.hook,
    colorScheme: NOTE_RENDER_PALETTE,
    mean: summary.mean,
    meta: { title: copy.canonicalTitle, unit, yearName: `${_meta.year}年` },
    allEntries: data.map((row) => ({ rank: row.rank, areaCode: row.area_code, areaName: row.area_name, value: row.value })),
  };
}

/** render-spec.json の中身 (時刻を含めない。同じ入力からは同じ内容になる) */
export function buildRenderSpec(slug, chartDataText, background) {
  const chartData = JSON.parse(chartDataText);
  return {
    schemaVersion: NOTE_RENDER_SCHEMA_VERSION,
    slug,
    rankingKey: chartData._meta.rankingKey,
    year: chartData._meta.year,
    input: { chartData: "chart-data.json", sha256: sha256(chartDataText) },
    renderer: { engine: "remotion", templateVersion: NOTE_RENDER_TEMPLATE_VERSION, palette: NOTE_RENDER_PALETTE },
    images: NOTE_RANKING_IMAGES,
    ...(background ? { background } : {}),
  };
}

/** 検査用。spec が現在の chart-data.json とテンプレート版に対して有効かを判定し、問題の文言を返す */
export function validateRenderSpec(slug, spec, chartDataText) {
  const errors = [];
  if (!spec || typeof spec !== "object") return ["render-spec.json を JSON オブジェクトとして読めない"];
  if (spec.schemaVersion !== NOTE_RENDER_SCHEMA_VERSION) errors.push(`schemaVersion=${spec.schemaVersion} が現行 ${NOTE_RENDER_SCHEMA_VERSION} と不一致`);
  if (spec.slug !== slug) errors.push(`slug=${spec.slug} が記事ディレクトリと不一致`);
  if (chartDataText && spec.input?.sha256 !== sha256(chartDataText)) errors.push("input.sha256 が現在の chart-data.json と不一致 (データを変えたのに画像を作り直していない)");
  if (spec.renderer?.templateVersion !== NOTE_RENDER_TEMPLATE_VERSION) {
    errors.push(`templateVersion=${spec.renderer?.templateVersion} が現行 ${NOTE_RENDER_TEMPLATE_VERSION} と不一致 (テンプレートを変えたのに画像を作り直していない)`);
  }
  errors.push(...validateBackground(slug, spec.background));
  const files = (spec.images ?? []).map((image) => image.file).sort().join(",");
  if (files !== NOTE_RANKING_IMAGES.map((image) => image.file).sort().join(",")) errors.push("images が現行の 4 枚構成と不一致");
  return errors;
}
