import type { SalesCoverage, SalesObservation } from "../../sales/types";
import { KDP_PUBLICATION_PLAN } from "./kdp-publishing-policy";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WEEK_PATTERN = /^\d{4}-W\d{2}$/;

export interface KdpWeeklyListing {
  readonly id?: string;
  readonly title?: string;
  readonly status?: string;
  readonly kdpStatus?: "draft" | "in_review" | "live" | "unknown";
  readonly publicationStage?: string;
  readonly salesStartedAt?: string | null;
  readonly lastSubmittedAt?: string | null;
  readonly withdrawal?: unknown;
}

/**
 * 2026-11-14 の方針 (型ごとに複数冊を出し、8 週の実売で型を判定) での週次の状態。
 * - hold: S1 が販売中に揃っていない
 * - prepare: 公開を待つ検証済みの本が無い。型ごとに次の本を作る
 * - ready-for-owner-approval: 検証済みの本がある。1 冊ずつオーナーの明示承認で出す
 */
export type KdpWeeklyGateStatus = "hold" | "prepare" | "ready-for-owner-approval";

export interface KdpCohortMeasurement {
  readonly cohort: "expansion";
  readonly requiredBookIds: readonly string[];
  readonly requiredPeriodByBook: Readonly<Record<string, { start: string; end: string }>>;
  readonly measuredBookIds: readonly string[];
  readonly missingBookIds: readonly string[];
  readonly windowStillOpenBookIds: readonly string[];
  readonly positiveEvidenceBookIds: readonly string[];
  /** 販売のある明細の期間が計測窓をはみ出し、窓の中の販売かを判定できない書籍 (月次レポートは日付を持たない) */
  readonly ambiguousEvidenceBookIds: readonly string[];
  readonly complete: boolean;
  readonly hasDemandSignal: boolean;
}

/** 型ごとの進み具合。続ける・増やす・止めるはオーナーが決める (ここは材料だけ) */
export interface KdpFormatProgress {
  readonly id: string;
  readonly concept: string;
  readonly liveBookIds: readonly string[];
  readonly inReviewBookIds: readonly string[];
  readonly verifiedBookIds: readonly string[];
  /** 8 週の窓が閉じて計測済みの本 */
  readonly measuredBookIds: readonly string[];
  /** 8 週の窓の中で販売・KENP があった本 */
  readonly demandBookIds: readonly string[];
  /** 公開中の本がすべて計測済みで、型の判定に進める */
  readonly readyForJudgement: boolean;
}

export interface KdpWeeklyDecision {
  readonly schemaVersion: 2;
  readonly generatedAt: string;
  readonly week: string;
  readonly status: KdpWeeklyGateStatus;
  readonly portfolio: {
    readonly registeredCatalogCount: number;
    readonly cohortMeasurementWeeks: number;
    readonly s1Live: number;
    readonly s1InReview: number;
    readonly pilotLive: number;
    readonly pilotInReview: number;
  };
  readonly formats: readonly KdpFormatProgress[];
  readonly candidate: { readonly id: string; readonly title: string } | null;
  /** 承認を受け付ける本 (検証済みの全冊)。kdp-weekly-publish はこの中の ID だけを通す */
  readonly eligibleCandidateIds: readonly string[];
  readonly cohortMeasurement: KdpCohortMeasurement | null;
  readonly blockers: readonly string[];
  readonly nextAction: string;
  readonly approvalRequired: true;
  readonly publishCommand: string | null;
}

function parseDate(value: string): Date {
  if (!DATE_PATTERN.test(value)) throw new Error(`invalid date: ${value}`);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`invalid date: ${value}`);
  return date;
}

function dateOnly(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`invalid datetime: ${value}`);
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) dates.push(cursor);
  return dates;
}

function observationCoversDate(row: SalesObservation, date: string): boolean {
  return row.channel === "kdp" && row.periodStart <= date && row.periodEnd >= date;
}

function isPositive(row: SalesObservation): boolean {
  return row.channel === "kdp" && (row.orders > 0 || row.units > 0 || row.netRevenueYen > 0 || (row.kenpRead ?? 0) > 0);
}

function analyzeCohort(
  bookIds: readonly string[],
  starts: Readonly<Record<string, string>>,
  observations: readonly SalesObservation[],
  coverage: readonly SalesCoverage[],
  asOfDate: string,
): KdpCohortMeasurement {
  const measuredBookIds: string[] = [];
  const missingBookIds: string[] = [];
  const windowStillOpenBookIds: string[] = [];
  const positiveEvidenceBookIds: string[] = [];
  const ambiguousEvidenceBookIds: string[] = [];
  const requiredPeriodByBook: Record<string, { start: string; end: string }> = {};

  for (const id of bookIds) {
    const start = starts[id];
    if (!start) {
      missingBookIds.push(id);
      continue;
    }
    const end = addDays(start, KDP_PUBLICATION_PLAN.cohortMeasurementWeeks * 7 - 1);
    requiredPeriodByBook[id] = { start, end };
    if (asOfDate < end) {
      windowStillOpenBookIds.push(id);
      continue;
    }
    const rows = observations.filter((row) => row.channel === "kdp" && row.productId === id);
    // 完全な月次レポートの範囲に入っていれば、行が無くても「計測済み・0 件」(行の無い月を 0 で埋めた扱いにはしない)
    const ranges = coverage.filter((range) => range.channel === "kdp" && range.productIds.includes(id));
    const covered = dateRange(start, end).every(
      (date) =>
        rows.some((row) => observationCoversDate(row, date)) ||
        ranges.some((range) => range.periodStart <= date && date <= range.periodEnd),
    );
    if (covered) {
      measuredBookIds.push(id);
      // 月次の明細は日付を持たないので、窓をはみ出す行の販売は窓の中のものと言えない (需要ありにも 0 にもしない)
      const positive = rows.filter((row) => isPositive(row) && row.periodEnd >= start && row.periodStart <= end);
      if (positive.some((row) => row.periodStart >= start && row.periodEnd <= end)) positiveEvidenceBookIds.push(id);
      else if (positive.length > 0) ambiguousEvidenceBookIds.push(id);
    } else {
      missingBookIds.push(id);
    }
  }

  return {
    cohort: "expansion",
    requiredBookIds: [...bookIds],
    requiredPeriodByBook,
    measuredBookIds,
    missingBookIds,
    windowStillOpenBookIds,
    positiveEvidenceBookIds,
    ambiguousEvidenceBookIds,
    complete: measuredBookIds.length === bookIds.length && bookIds.length > 0,
    hasDemandSignal: positiveEvidenceBookIds.length > 0,
  };
}

function weekNumber(week: string): number {
  if (!WEEK_PATTERN.test(week)) throw new Error(`week must be YYYY-Www: ${week}`);
  const [year, value] = week.split("-W");
  return Number(year) * 100 + Number(value);
}

function isOnOrAfterProgramStart(value: string | null | undefined): boolean {
  return Boolean(value) && dateOnly(value as string) >= KDP_PUBLICATION_PLAN.expansionProgramStartsAt;
}

export function buildKdpWeeklyDecision(input: {
  readonly week: string;
  readonly generatedAt: string;
  readonly listings: Readonly<Record<string, KdpWeeklyListing>>;
  readonly observations: readonly SalesObservation[];
  readonly coverage?: readonly SalesCoverage[];
}): KdpWeeklyDecision {
  weekNumber(input.week);
  const asOfDate = dateOnly(input.generatedAt);
  const rows = Object.entries(input.listings).map(([id, listing]) => ({ ...listing, id }));
  const s1 = rows.filter((row) => row.id.startsWith("K-S1-"));
  // 作り直しの本: S1 以外で、出版停止の記録が無く、方針の開始日以降に提出・販売開始したか、検証済みの下書き
  const expansion = rows.filter(
    (row) =>
      !row.id.startsWith("K-S1-") &&
      !row.withdrawal &&
      (isOnOrAfterProgramStart(row.salesStartedAt) ||
        isOnOrAfterProgramStart(row.lastSubmittedAt) ||
        (row.status === "draft" && row.publicationStage === "verified")),
  );
  const live = expansion.filter((row) => row.status === "listed" && row.kdpStatus === "live");
  const inReview = expansion.filter((row) => row.kdpStatus === "in_review");
  const eligible = expansion
    .filter((row) => row.status === "draft" && row.kdpStatus === "draft" && row.publicationStage === "verified")
    .sort((a, b) => a.id.localeCompare(b.id));

  const measurement =
    live.length > 0
      ? analyzeCohort(
          live.map((row) => row.id),
          Object.fromEntries(live.filter((row) => row.salesStartedAt).map((row) => [row.id, dateOnly(row.salesStartedAt as string)])),
          input.observations,
          input.coverage ?? [],
          asOfDate,
        )
      : null;

  const formats: KdpFormatProgress[] = KDP_PUBLICATION_PLAN.formats.map((format) => {
    const inFormat = (ids: readonly string[]) => ids.filter((id) => id.startsWith(format.bookIdPrefix));
    const liveIds = inFormat(live.map((row) => row.id));
    const measuredIds = inFormat(measurement?.measuredBookIds ?? []);
    return {
      id: format.id,
      concept: format.concept,
      liveBookIds: liveIds,
      inReviewBookIds: inFormat(inReview.map((row) => row.id)),
      verifiedBookIds: inFormat(eligible.map((row) => row.id)),
      measuredBookIds: measuredIds,
      demandBookIds: inFormat(measurement?.positiveEvidenceBookIds ?? []),
      readyForJudgement: liveIds.length > 0 && measuredIds.length === liveIds.length,
    };
  });

  const base = {
    schemaVersion: 2 as const,
    generatedAt: input.generatedAt,
    week: input.week,
    portfolio: {
      registeredCatalogCount: KDP_PUBLICATION_PLAN.registeredCatalogCount,
      cohortMeasurementWeeks: KDP_PUBLICATION_PLAN.cohortMeasurementWeeks,
      s1Live: s1.filter((row) => row.kdpStatus === "live").length,
      s1InReview: s1.filter((row) => row.kdpStatus === "in_review").length,
      pilotLive: live.length,
      pilotInReview: inReview.length,
    },
    formats,
    eligibleCandidateIds: eligible.map((row) => row.id),
    cohortMeasurement: measurement,
    approvalRequired: true as const,
  };

  if (base.portfolio.s1Live < KDP_PUBLICATION_PLAN.approvedS1Count) {
    const missing = s1.filter((row) => row.kdpStatus !== "live").map((row) => `${row.id}:${row.kdpStatus ?? "unknown"}`);
    return {
      ...base,
      status: "hold",
      blockers: [`S1販売中 ${base.portfolio.s1Live}/${KDP_PUBLICATION_PLAN.approvedS1Count}`, ...missing],
      nextAction: "S1の審査状態を同期し、live read-backを完了する",
      candidate: null,
      publishCommand: null,
    };
  }

  const judgeable = formats.filter((format) => format.readyForJudgement).map((format) => format.id);
  const judgeNote = judgeable.length > 0 ? `。8週の計測が揃った型 (${judgeable.join(", ")}) は続ける・増やす・止めるをオーナーが決める` : "";

  if (eligible.length === 0) {
    const empty = formats.filter((format) => format.liveBookIds.length + format.inReviewBookIds.length === 0).map((format) => format.concept);
    return {
      ...base,
      status: "prepare",
      blockers: ["検証済み (verified) の本が0冊"],
      nextAction: `KDP-EXPANSION-01 の順で次の本を設計・生成・全章レビュー・Previewer確認する${empty.length > 0 ? `。まだ1冊も出ていない型: ${empty.join("・")}` : ""}${judgeNote}`,
      candidate: null,
      publishCommand: null,
    };
  }

  const candidate = { id: eligible[0].id, title: eligible[0].title ?? eligible[0].id };
  return {
    ...base,
    status: "ready-for-owner-approval",
    blockers: [],
    nextAction: `検証済みの本 (${base.eligibleCandidateIds.join(", ")}) の書誌・表紙・価格をオーナーが確認し、1冊ずつIDを明示承認した本だけ送信する${judgeNote}`,
    candidate,
    publishCommand: `node .claude/scripts/kdp/kdp-weekly-publish.mjs --week ${input.week} --id ${candidate.id} --owner-approved ${candidate.id} --commit`,
  };
}
