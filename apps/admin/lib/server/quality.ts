import "server-only";

import { cached, fileExists, readJson, TTL, wrap, type Wrapped } from "./state-io";

/**
 * 品質キューの横断サマリ。**1 行 1 キュー**に揃えて「どこに欠陥が何件残っているか」だけ出す。
 *
 * ★大きい JSON の中身は返さない。integrity-audit は 110KB、remediation-queue は 240KB あり、
 *   全件を画面へ渡しても読めない。詳細は各 skill / CLI が担当で、ここは所在と残数を示す。
 * ★鮮度を必ず添える。structure-audit と chart-audit は生成が止まっており、
 *   古い数字を「現在の欠陥数」として読むと判断を誤る。
 */

export interface QualityQueue {
  key: string;
  label: string;
  /** 真実源のパス (画面に出して追跡できるようにする) */
  file: string;
  exists: boolean;
  generatedAt: string | null;
  /** 総件数 (対象の母数) */
  total: number | null;
  /** 未対応・欠陥の件数。null は「この観点では欠陥を数えていない」 */
  defects: number | null;
  defectLabel: string;
  detail: string;
  error?: string;
}

const Q = ".claude/state";

function q(
  key: string,
  label: string,
  file: string,
  defectLabel: string,
  extract: (d: any) => { generatedAt?: string | null; total?: number | null; defects?: number | null; detail?: string },
): QualityQueue {
  const base: QualityQueue = {
    key,
    label,
    file,
    exists: fileExists(file),
    generatedAt: null,
    total: null,
    defects: null,
    defectLabel,
    detail: "",
  };
  if (!base.exists) return base;
  const r = wrap(() => extract(readJson<any>(file)));
  if (typeof r === "object" && r !== null && "error" in r) {
    return { ...base, error: (r as { error: string }).error };
  }
  return {
    ...base,
    generatedAt: r.generatedAt ?? null,
    total: r.total ?? null,
    defects: r.defects ?? null,
    detail: r.detail ?? "",
  };
}

export function qualityQueues(): QualityQueue[] {
  return [
    q(
      "blog-remediation",
      "ブログ品質 是正キュー",
      `${Q}/blog/remediation-queue.json`,
      "must-fix 未対応",
      (d) => ({
        generatedAt: d.generatedAt,
        total: d.summary?.total ?? null,
        defects: d.summary?.mustFixPending ?? null,
        detail: `pending ${d.summary?.pending ?? "-"} / done ${d.summary?.done ?? "-"}`,
      }),
    ),
    q(
      "svg-lineage",
      "ブログ SVG の系譜",
      `${Q}/blog/svg-lineage-queue.json`,
      "元データ消失",
      (d) => ({
        generatedAt: d.generatedAt,
        total: d.total ?? null,
        defects: d.byStatus?.neither ?? null,
        detail: `both ${d.byStatus?.both ?? "-"} / jsonOnly ${d.byStatus?.jsonOnly ?? "-"}`,
      }),
    ),
    q(
      "chart-provenance",
      "チャート出典 (再取得可能性)",
      `${Q}/blog/chart-provenance-queue.json`,
      "欠陥",
      (d) => ({
        generatedAt: d.generatedAt,
        total: d.checked ?? null,
        defects: d.defectCount ?? null,
        detail: Object.entries(d.byVerdict ?? {})
          .map(([k, v]) => `${k} ${v}`)
          .join(" / "),
      }),
    ),
    q(
      "internal-link",
      "サイト内リンク",
      `${Q}/blog/internal-link-audit.json`,
      "リンク切れ",
      (d) => {
        const byType: Record<string, { total?: number; broken?: number }> = d.byType ?? {};
        const broken = Object.values(byType).reduce((s, v) => s + (v.broken ?? 0), 0);
        return {
          generatedAt: d.generatedAt,
          total: d.totalLinks ?? null,
          defects: broken,
          detail: Object.entries(byType)
            .map(([k, v]) => `${k} ${v.broken ?? 0}/${v.total ?? 0}`)
            .join(" / "),
        };
      },
    ),
    q(
      "ranking-integrity",
      "ランキング整合性",
      `${Q}/ranking/integrity-audit.json`,
      "欠落",
      (d) => ({
        generatedAt: d.generatedAt,
        total: d.totals?.activeKeys ?? null,
        defects:
          (d.totals?.itemMissing ?? 0) +
          (d.totals?.valuesMissing ?? 0) +
          (d.totals?.yearMismatch ?? 0),
        detail: `item ${d.totals?.itemMissing ?? 0} / values ${d.totals?.valuesMissing ?? 0} / year ${d.totals?.yearMismatch ?? 0}`,
      }),
    ),
    q(
      "provenance",
      "データ出典・再現性",
      `${Q}/provenance/queue.json`,
      "要対応",
      (d) => ({
        generatedAt: d.generatedAt,
        total: d.metricTotal ?? null,
        defects: d.needsWorkCount ?? null,
        detail: Object.entries(d.byClass ?? {})
          .map(([k, v]) => `${k} ${v}`)
          .join(" / "),
      }),
    ),
    q(
      "structure-audit",
      "記事構造 (source-link 配置)",
      `${Q}/blog/structure-audit.json`,
      "違反記事",
      (d) => ({
        generatedAt: d.generatedAt,
        total: d.articlesScanned ?? null,
        defects: d.articlesViolating ?? null,
        detail: "",
      }),
    ),
    q(
      "chart-audit",
      "チャート SVG 品質",
      `${Q}/blog/chart-audit.json`,
      "エラー記事",
      (d) => ({
        generatedAt: d.generatedAt,
        total: d.articlesWithCharts ?? null,
        defects: d.articlesWithErrors ?? null,
        detail: `SVG ${d.totalSvgs ?? "-"} / darkMode 非準拠 ${d.articlesDarkModeNonCompliant ?? "-"}`,
      }),
    ),
  ];
}

export interface QualitySummary {
  queues: QualityQueue[];
  /** 欠陥が 1 件以上あるキューの数 (見出しの要約に使う) */
  queuesWithDefects: number;
}

export function qualitySummary(): QualitySummary {
  return cached("quality", TTL.daily, () => {
    const queues = qualityQueues();
    return {
      queues,
      queuesWithDefects: queues.filter((x) => (x.defects ?? 0) > 0).length,
    };
  });
}

export type { Wrapped };
