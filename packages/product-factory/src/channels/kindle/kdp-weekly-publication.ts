import type { SalesObservation } from "../../sales/types";
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

export type KdpWeeklyGateStatus =
  | "hold"
  | "measure"
  | "prepare-one"
  | "ready-for-owner-approval"
  | "observe"
  | "stop-no-demand"
  | "complete";

export interface KdpCohortMeasurement {
  readonly cohort: "s1-baseline" | "latest-pilot";
  readonly requiredBookIds: readonly string[];
  readonly requiredPeriodByBook: Readonly<Record<string, { start: string; end: string }>>;
  readonly measuredBookIds: readonly string[];
  readonly missingBookIds: readonly string[];
  readonly windowStillOpenBookIds: readonly string[];
  readonly positiveEvidenceBookIds: readonly string[];
  readonly complete: boolean;
  readonly hasDemandSignal: boolean;
}

export interface KdpWeeklyDecision {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly week: string;
  readonly status: KdpWeeklyGateStatus;
  readonly scheduledAction: string;
  readonly portfolio: {
    readonly registeredCatalogCount: number;
    readonly activePublicationTargetCount: number;
    readonly maxNewPublicationsPerWeek: number;
    readonly cohortMeasurementWeeks: number;
    readonly s1Live: number;
    readonly s1InReview: number;
    readonly pilotLive: number;
    readonly pilotInReview: number;
  };
  readonly nextPilot: (typeof KDP_PUBLICATION_PLAN.pilots)[number] | null;
  readonly candidate: { readonly id: string; readonly title: string } | null;
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

function hasPositiveEvidence(rows: readonly SalesObservation[]): boolean {
  return rows.some(
    (row) => row.channel === "kdp" && (row.orders > 0 || row.units > 0 || row.netRevenueYen > 0 || (row.kenpRead ?? 0) > 0),
  );
}

function analyzeCohort(
  cohort: KdpCohortMeasurement["cohort"],
  bookIds: readonly string[],
  starts: Readonly<Record<string, string>>,
  observations: readonly SalesObservation[],
  asOfDate: string,
): KdpCohortMeasurement {
  const measuredBookIds: string[] = [];
  const missingBookIds: string[] = [];
  const windowStillOpenBookIds: string[] = [];
  const positiveEvidenceBookIds: string[] = [];
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
    const covered = dateRange(start, end).every((date) => rows.some((row) => observationCoversDate(row, date)));
    if (covered) {
      measuredBookIds.push(id);
      if (hasPositiveEvidence(rows)) positiveEvidenceBookIds.push(id);
    } else {
      missingBookIds.push(id);
    }
  }

  return {
    cohort,
    requiredBookIds: [...bookIds],
    requiredPeriodByBook,
    measuredBookIds,
    missingBookIds,
    windowStillOpenBookIds,
    positiveEvidenceBookIds,
    complete: measuredBookIds.length === bookIds.length && bookIds.length > 0,
    hasDemandSignal: positiveEvidenceBookIds.length > 0,
  };
}

function weekNumber(week: string): number {
  if (!WEEK_PATTERN.test(week)) throw new Error(`week must be YYYY-Www: ${week}`);
  const [year, value] = week.split("-W");
  return Number(year) * 100 + Number(value);
}

function scheduledAction(week: string): string {
  const number = weekNumber(week);
  if (number <= 202638) return KDP_PUBLICATION_PLAN.weeklySequence[0].action;
  if (number === 202639) return KDP_PUBLICATION_PLAN.weeklySequence[1].action;
  if (number === 202640) return KDP_PUBLICATION_PLAN.weeklySequence[2].action;
  if (number === 202641) return KDP_PUBLICATION_PLAN.weeklySequence[3].action;
  if (number >= 202642 && number <= 202644) return KDP_PUBLICATION_PLAN.weeklySequence[4].action;
  if (number >= 202645 && number <= 202648) return KDP_PUBLICATION_PLAN.weeklySequence[5].action;
  if (number === 202649) return KDP_PUBLICATION_PLAN.weeklySequence[6].action;
  return KDP_PUBLICATION_PLAN.weeklySequence[7].action;
}

function isSameIsoWeek(timestamp: string | null | undefined, week: string): boolean {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const number = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(number).padStart(2, "0")}` === week;
}

function result(
  base: Omit<KdpWeeklyDecision, "status" | "blockers" | "nextAction" | "candidate" | "publishCommand">,
  status: KdpWeeklyGateStatus,
  blockers: readonly string[],
  nextAction: string,
  candidate: KdpWeeklyDecision["candidate"] = null,
): KdpWeeklyDecision {
  const publishCommand =
    status === "ready-for-owner-approval" && candidate
      ? `node .claude/scripts/kdp/kdp-weekly-publish.mjs --week ${base.week} --id ${candidate.id} --owner-approved ${candidate.id} --commit`
      : null;
  return { ...base, status, blockers, nextAction, candidate, publishCommand };
}

export function buildKdpWeeklyDecision(input: {
  readonly week: string;
  readonly generatedAt: string;
  readonly listings: Readonly<Record<string, KdpWeeklyListing>>;
  readonly observations: readonly SalesObservation[];
}): KdpWeeklyDecision {
  weekNumber(input.week);
  const asOfDate = dateOnly(input.generatedAt);
  const rows = Object.entries(input.listings).map(([id, listing]) => ({ ...listing, id }));
  const s1 = rows.filter((row) => row.id.startsWith("K-S1-"));
  const pilotRows = rows.filter(
    (row) =>
      !row.id.startsWith("K-S1-") &&
      ((row.salesStartedAt && row.salesStartedAt >= KDP_PUBLICATION_PLAN.expansionProgramStartsAt) ||
        (row.lastSubmittedAt && dateOnly(row.lastSubmittedAt) >= KDP_PUBLICATION_PLAN.expansionProgramStartsAt) ||
        (row.status === "draft" && row.publicationStage === "verified")),
  );
  const pilotLive = pilotRows
    .filter((row) => row.status === "listed" && row.kdpStatus === "live")
    .sort((a, b) => String(a.salesStartedAt).localeCompare(String(b.salesStartedAt)) || a.id.localeCompare(b.id));
  const pilotInReview = pilotRows.filter((row) => row.kdpStatus === "in_review");
  const eligible = rows
    .filter(
      (row) =>
        !row.id.startsWith("K-S1-") &&
        row.status === "draft" &&
        row.kdpStatus === "draft" &&
        row.publicationStage === "verified" &&
        !row.withdrawal,
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  const nextPilot = KDP_PUBLICATION_PLAN.pilots[pilotLive.length] ?? null;
  const portfolio = {
    registeredCatalogCount: KDP_PUBLICATION_PLAN.registeredCatalogCount,
    activePublicationTargetCount: KDP_PUBLICATION_PLAN.activePublicationTargetCount,
    maxNewPublicationsPerWeek: KDP_PUBLICATION_PLAN.maxNewPublicationsPerWeek,
    cohortMeasurementWeeks: KDP_PUBLICATION_PLAN.cohortMeasurementWeeks,
    s1Live: s1.filter((row) => row.kdpStatus === "live").length,
    s1InReview: s1.filter((row) => row.kdpStatus === "in_review").length,
    pilotLive: pilotLive.length,
    pilotInReview: pilotInReview.length,
  };
  const common = {
    schemaVersion: 1 as const,
    generatedAt: input.generatedAt,
    week: input.week,
    scheduledAction: scheduledAction(input.week),
    portfolio,
    nextPilot,
    eligibleCandidateIds: eligible.map((row) => row.id),
    cohortMeasurement: null as KdpCohortMeasurement | null,
    approvalRequired: true as const,
  };

  if (portfolio.s1Live < KDP_PUBLICATION_PLAN.approvedS1Count) {
    const missing = s1.filter((row) => row.kdpStatus !== "live").map((row) => `${row.id}:${row.kdpStatus ?? "unknown"}`);
    return result(common, "hold", [`S1販売中 ${portfolio.s1Live}/${KDP_PUBLICATION_PLAN.approvedS1Count}`, ...missing], "S1の審査状態を同期し、12冊すべてのlive read-backを完了する");
  }

  if (pilotInReview.length > 0) {
    return result(common, "observe", pilotInReview.map((row) => `${row.id}:in_review`), "審査中パイロットのlive read-backまで新規出版を止める");
  }

  if (pilotLive.length >= KDP_PUBLICATION_PLAN.evidenceGatedPilotCount) {
    return result(common, "complete", [], "15冊の販売対象を維持し、各冊の4週実測を継続する");
  }

  let measurement: KdpCohortMeasurement;
  if (pilotLive.length === 0) {
    const starts = Object.fromEntries(KDP_PUBLICATION_PLAN.baselineCohort.bookIds.map((id) => [id, KDP_PUBLICATION_PLAN.baselineCohort.measurementStartsAt]));
    measurement = analyzeCohort("s1-baseline", KDP_PUBLICATION_PLAN.baselineCohort.bookIds, starts, input.observations, asOfDate);
  } else {
    const latest = pilotLive[pilotLive.length - 1];
    measurement = analyzeCohort("latest-pilot", [latest.id], { [latest.id]: latest.salesStartedAt as string }, input.observations, asOfDate);
  }
  const withMeasurement = { ...common, cohortMeasurement: measurement };

  if (measurement.windowStillOpenBookIds.length > 0) {
    return result(withMeasurement, "observe", [`4週窓が未成熟: ${measurement.windowStillOpenBookIds.join(", ")}`], "4週窓が閉じた後にKDP販売数/KENPを記録する");
  }
  if (!measurement.complete) {
    return result(withMeasurement, "measure", [`販売数/KENP未計測: ${measurement.missingBookIds.join(", ")}`], "KDPレポートをproducts:salesへ証拠付きで記録する");
  }
  if (!measurement.hasDemandSignal) {
    return result(withMeasurement, "stop-no-demand", ["4週実測は完了したが、販売・売上・KENPの需要シグナルが0"], "新規出版を止め、既刊の価値・価格・導線を見直す");
  }

  const submittedThisWeek = pilotRows.filter((row) => isSameIsoWeek(row.lastSubmittedAt, input.week));
  if (submittedThisWeek.length >= KDP_PUBLICATION_PLAN.maxNewPublicationsPerWeek) {
    return result(withMeasurement, "observe", [`当週提出済み: ${submittedThisWeek.map((row) => row.id).join(", ")}`], "当週は追加出版せず、審査と販売開始を確認する");
  }
  if (eligible.length > 1) {
    return result(withMeasurement, "hold", [`verified候補が複数: ${eligible.map((row) => row.id).join(", ")}`], "週次計画で候補を1冊に絞り、残りをdraft前へ戻す");
  }
  if (eligible.length === 0) {
    return result(withMeasurement, "prepare-one", ["verified状態の新規パイロットが0冊"], `第${nextPilot?.ordinal ?? "-"}パイロット「${nextPilot?.concept ?? "未定"}」を1冊だけ設計・生成・レビュー・Previewer確認する`);
  }

  const candidate = { id: eligible[0].id, title: eligible[0].title ?? eligible[0].id };
  return result(withMeasurement, "ready-for-owner-approval", [], `${candidate.id}の書誌・表紙・価格をオーナーが確認し、当該IDを明示承認した場合だけ送信する`, candidate);
}
