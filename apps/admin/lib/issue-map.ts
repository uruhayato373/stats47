/**
 * 事業イシューマップ。台帳 `data/business/issue-map.json` を画面の形にし、判定日と進み具合を
 * 参照先の台帳 (improvements・pilot-board・experiments・backlog) から引く。行の題・問い・例はコンテンツの型の台帳
 * (content.types) から結ぶ。ファイルは読まない純関数で、入力の読み取りは lib/server/issue-map.ts。
 *
 * 社会の問いの台帳 `data/content/issues.json` とは別物。日付や状態を台帳へ写すと参照先とずれるので、
 * ここで毎回解決する (参照先の無い ID は「参照先なし」として画面に出す)。
 */

import type { ContentTypeDef } from "./content-coverage";

export type RefKind ="improvement" | "backlog" | "pilot" | "experiment";
export type StateKind = "seen" | "open" | "unknown" | "undecided";
export type Rating = "◎" | "○" | "△" | "✕";

export interface LedgerRef {
  kind: RefKind;
  id: string;
}
export interface IssueState {
  kind: StateKind;
  label: string;
}
export interface Judgment {
  picture: string;
  ref: LedgerRef | null;
}
export interface IssueCell {
  id: string;
  row: string;
  column: string;
  rating: Rating;
  ratingLabel: string;
  states: IssueState[];
  evidence: string;
  next?: string;
  judgments?: Judgment[];
  refs?: LedgerRef[];
}
export interface IssuePremise {
  id: string;
  title: string;
  state: IssueState;
  evidence: string;
  judgments?: Judgment[];
}
/** 台帳の行。題・問い・例は写さず、contentType で型の台帳から結ぶ */
export interface IssueRowSpec {
  id: string;
  contentType: string;
  relatedDataset?: string;
}
export interface IssueRow extends IssueRowSpec {
  title: string;
  question: string;
  examples: string;
}
export interface IssueColumn {
  id: string;
  title: string;
  description: string;
}
export interface StorylineStep {
  key: string;
  kind: string;
  title: string;
  points: string[];
}
export interface IssueNote {
  id: string;
  observedAt: string;
  text: string;
  cells: string[];
}
export interface IssueMapSpec {
  observedAt: string;
  issue: { id: string; question: string; hypothesis: string; criteria: string[] };
  columns: IssueColumn[];
  rows: IssueRowSpec[];
  cells: IssueCell[];
  premises: IssuePremise[];
  storyline: { steps: StorylineStep[]; summary: string };
  notes: IssueNote[];
}

/** 参照先の台帳の、日付と状態だけを ID で引ける形にしたもの */
export interface LedgerIndex {
  today: string;
  improvements: Record<string, { due: string; status: string }>;
  backlog: Record<string, { due: string | null; wip: boolean }>;
  pilots: Record<string, { judgeDate: string | null; state: string }>;
  experiments: Record<string, { nextCheck: string | null; status: string }>;
}

export interface ResolvedRef extends LedgerRef {
  found: boolean;
  /** 参照先が持つ判定日。無ければ null (画面では未定) */
  date: string | null;
  status: string | null;
}
export interface ScheduleRow {
  /** どのマス・前提の判定か */
  label: string;
  picture: string;
  ref: ResolvedRef | null;
  date: string | null;
  overdue: boolean;
}
export type CellView = IssueCell & { label: string; judgmentRefs: ResolvedRef[]; otherRefs: ResolvedRef[]; notes: IssueNote[] };
export type RowView = IssueRow & { cells: CellView[] };
export type PremiseView = IssuePremise & { judgmentRefs: ResolvedRef[] };

const toDate = (value: string | null | undefined) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);

export function resolveRef(ref: LedgerRef, index: LedgerIndex): ResolvedRef {
  const miss = { ...ref, found: false, date: null, status: null };
  switch (ref.kind) {
    case "improvement": {
      const hit = index.improvements[ref.id];
      return hit ? { ...ref, found: true, date: toDate(hit.due), status: hit.status } : miss;
    }
    case "backlog": {
      const hit = index.backlog[ref.id];
      return hit ? { ...ref, found: true, date: toDate(hit.due), status: hit.wip ? "進行中" : "カードあり" } : miss;
    }
    case "pilot": {
      const hit = index.pilots[ref.id];
      return hit ? { ...ref, found: true, date: toDate(hit.judgeDate), status: hit.state } : miss;
    }
    case "experiment": {
      const hit = index.experiments[ref.id];
      return hit ? { ...ref, found: true, date: toDate(hit.nextCheck), status: hit.status } : miss;
    }
  }
}

/** 形だけでは見えない崩れ。4 行 × 3 列の全マスが 1 つずつあり、ID の指す先 (型を含む) が実在すること */
export function validateIssueMap(spec: IssueMapSpec, contentTypes: ContentTypeDef[]): string[] {
  const problems: string[] = [];
  const typeIds = new Set(contentTypes.map((t) => t.id));
  for (const row of spec.rows) if (!typeIds.has(row.contentType)) problems.push(`${row.id}: 型 ${row.contentType} が型の台帳に無い`);
  const rows = new Set(spec.rows.map((r) => r.id));
  const columns = new Set(spec.columns.map((c) => c.id));
  const seen = new Set<string>();
  const cellIds = new Set(spec.cells.map((c) => c.id));
  for (const cell of spec.cells) {
    if (!rows.has(cell.row)) problems.push(`${cell.id}: 行 ${cell.row} が無い`);
    if (!columns.has(cell.column)) problems.push(`${cell.id}: 列 ${cell.column} が無い`);
    const pair = `${cell.row} × ${cell.column}`;
    if (seen.has(pair)) problems.push(`${cell.id}: ${pair} が重複している`);
    seen.add(pair);
  }
  for (const row of rows) {
    for (const column of columns) {
      if (!seen.has(`${row} × ${column}`)) problems.push(`${row} × ${column} のマスが無い`);
    }
  }
  for (const note of spec.notes) {
    for (const id of note.cells) if (!cellIds.has(id)) problems.push(`${note.id}: マス ${id} が無い`);
  }
  return problems;
}

/** 日付のある行を早い順に並べ、日付の無い行は台帳の順のまま後ろに置く */
function sortSchedule(rows: ScheduleRow[]) {
  const dated = rows.filter((r) => r.date).sort((a, b) => a.date!.localeCompare(b.date!));
  return [...dated, ...rows.filter((r) => !r.date)];
}

export function buildIssueMap(spec: IssueMapSpec, index: LedgerIndex, contentTypes: ContentTypeDef[]) {
  const problems = validateIssueMap(spec, contentTypes);
  const typeById = new Map(contentTypes.map((t) => [t.id, t]));
  const resolve = (ref: LedgerRef) => resolveRef(ref, index);
  const schedule: ScheduleRow[] = [];
  const addSchedule = (label: string, judgments: Judgment[] = []) => {
    for (const j of judgments) {
      const ref = j.ref ? resolve(j.ref) : null;
      const date = ref?.date ?? null;
      schedule.push({ label, picture: j.picture, ref, date, overdue: Boolean(date && date < index.today) });
    }
  };

  const columnTitle = new Map(spec.columns.map((c) => [c.id, c.title]));
  const withType = (row: IssueRowSpec): IssueRow => {
    const type = typeById.get(row.contentType);
    return { ...row, title: type?.title ?? "", question: type?.question ?? "", examples: type?.examples ?? "" };
  };
  const rows: RowView[] = spec.rows.map(withType).map((row) => ({
    ...row,
    cells: spec.columns.flatMap((column) => {
      const cell = spec.cells.find((c) => c.row === row.id && c.column === column.id);
      if (!cell) return [];
      const label = `${row.title} × ${columnTitle.get(cell.column)}`;
      addSchedule(label, cell.judgments);
      return [
        {
          ...cell,
          label,
          judgmentRefs: (cell.judgments ?? []).flatMap((j) => (j.ref ? [resolve(j.ref)] : [])),
          otherRefs: (cell.refs ?? []).map(resolve),
          notes: spec.notes.filter((n) => n.cells.includes(cell.id)),
        },
      ];
    }),
  }));
  const premises: PremiseView[] = spec.premises.map((premise) => {
    addSchedule(`前提: ${premise.title}`, premise.judgments);
    return { ...premise, judgmentRefs: (premise.judgments ?? []).flatMap((j) => (j.ref ? [resolve(j.ref)] : [])) };
  });

  const allRefs = [...rows.flatMap((r) => r.cells.flatMap((c) => [...c.judgmentRefs, ...c.otherRefs])), ...premises.flatMap((p) => p.judgmentRefs)];
  for (const ref of allRefs) if (!ref.found) problems.push(`${ref.kind} の ${ref.id} が参照先に無い`);

  return {
    observedAt: spec.observedAt,
    issue: spec.issue,
    columns: spec.columns,
    rows,
    premises,
    schedule: sortSchedule(schedule),
    storyline: spec.storyline,
    notes: spec.notes,
    problems,
  };
}

export type IssueMapBuilt = ReturnType<typeof buildIssueMap>;
