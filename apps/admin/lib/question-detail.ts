/**
 * 問いの詳細と公開待ちの下書き: 何を作り、どこへつないだかを中身で見せるための整形。読み取りのみ。
 * 事業の問いとは混ぜない (lib/question-progress.ts の冒頭)。
 */

/** frontmatter の 1 行の値 */
export function frontmatterValue(markdown: string, name: string): string | null {
  const match = new RegExp(`^${name}:\\s*(.+)$`, "m").exec(markdown.split(/^---\s*$/m)[1] ?? "");
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : null;
}

/** 本文の見出し (h2) の並び */
export function outlineOf(markdown: string): string[] {
  return [...markdown.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
}

/** review.md の verdict。無ければ null */
export function verdictOf(review: string): string | null {
  return /^verdict:\s*(\w+)/m.exec(review)?.[1] ?? null;
}

/** 記事の図のうち、明るい版だけを本文の順に返す */
export function articleFigures(markdown: string): string[] {
  return [...markdown.matchAll(/!\[[^\]]*\]\(data\/([^)]+\.svg)\)/g)].map((m) => m[1]);
}

export type AnalysisInput = { key: string; title: string; derived: boolean; rankingHref: string | null; municipalityHref: string | null };

type InputPage = { title: string; href: string; published?: boolean };

/**
 * 分析に使ったデータを、入力と求めた指標の順に 1 回ずつ並べる。
 * リンクは公開中のページだけにし、無ければ null を返す (画面に「なし」と出す)。
 */
export function analysisInputs(specKeys: string[], derived: Array<{ key: string; label: string }>, pageOf: (id: string) => InputPage | undefined): AnalysisInput[] {
  const published = (id: string) => {
    const page = pageOf(id);
    return page?.published ? page : undefined;
  };
  const row = (key: string, label: string | null): AnalysisInput => {
    const ranking = published(`ranking:${key}`);
    const municipality = published(`municipality-ranking:${key}`);
    return { key, title: label ?? ranking?.title ?? municipality?.title ?? key, derived: label !== null, rankingHref: ranking?.href ?? null, municipalityHref: municipality?.href ?? null };
  };
  const seen = new Set<string>();
  return [...specKeys.map((key) => row(key, null)), ...derived.map((d) => row(d.key, d.label))].filter((r) => !seen.has(r.key) && Boolean(seen.add(r.key)));
}

export type AnalysisViewpoint = { layer: string; status: "done" | "na"; result?: string; evidence?: string; reason?: string };
export type ViewpointLayer = { id: string; label: string; ask: string };
export type ViewpointRow = { id: string; label: string; ask: string; status: "済み" | "対象外" | "未"; text: string; evidence: string | null };

/** 工程の表示名。順序の正本は analysis-cycle-core.mjs の ANALYSIS_STAGES */
export const ANALYSIS_STAGE_LABELS: Record<string, string> = {
  framed: "表を作成",
  viewpoints: "視点の確認",
  figures: "図",
  draft: "下書き",
  reviewed: "審査済み",
  approved: "オーナー確認済み",
  published: "公開",
  evaluated: "評価済み",
};

/** 視点の層ごとの結果。分析に行が無い層は「未」として出し、抜けを隠さない */
export function viewpointRows(viewpoints: readonly AnalysisViewpoint[], layers: readonly ViewpointLayer[]): ViewpointRow[] {
  const byLayer = new Map(viewpoints.map((row) => [row.layer, row]));
  return layers.map((layer) => {
    const row = byLayer.get(layer.id);
    const base = { id: layer.id, label: layer.label, ask: layer.ask };
    if (!row) return { ...base, status: "未", text: "", evidence: null };
    if (row.status === "na") return { ...base, status: "対象外", text: row.reason ?? "", evidence: null };
    return { ...base, status: "済み", text: row.result ?? "", evidence: row.evidence ?? null };
  });
}
