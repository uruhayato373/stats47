/**
 * 収益化戦略 §5「意思決定ゲートと実行順」のゲート表を、既存の判定につないで 通過・未達・判定元なし に並べる。
 * ファイルは読まない (読むのは lib/server/strategy-gates.ts)。
 *
 * ★ここで判定を作らない。既存の判定 (アフィリエイト運用の measurementGate・pilot readiness・売上の計測範囲) の
 *   値を写すだけにする。判定する関数や state が無い行は「判定元なし」と出し、推測で通過・未達にしない。
 *   表の行が増減したら issues に出し、tests/unit/strategy-gates.test.ts が現物の表で止める。
 *   B2B基盤 の行には、行政向け商品の検証の進み具合 (lib/admin-stat-pilot.ts) を並べる。聞き取り台帳は
 *   通過・未達を決める記録を持たないので、状態は「判定元なし」のままにする。
 */

import type { AdminStatPilotProgress } from "./admin-stat-pilot";

export type GateState = "pass" | "fail" | "no-source";

/** §5 の表の行。行を足す・消すときは SOURCES とそろえる (テストが現物の表と照合する) */
export const GATE_NAMES = ["計測", "AdSense", "アフィ横展開", "トラフィック拡大", "商品横展開", "B2B基盤"] as const;
export type GateName = (typeof GATE_NAMES)[number];

export interface GateRow {
  name: string;
  passCondition: string;
  onFail: string;
}

/** 既存のゲート (status が ready のときだけ通過)。generatedAt は state を作った時刻 */
export interface GateStatus {
  status: string;
  reasons: string[];
  generatedAt: string | null;
}

export interface GateInputs {
  /** data/affiliate/affiliate-operations-latest.json の measurementGate。読めなければ null */
  measurementGate: GateStatus | null;
  /** data/affiliate/affiliate-pilot-readiness-latest.json の readiness。読めなければ null */
  pilotReadiness: GateStatus | null;
  /** 売上の計測範囲 (lib/server/revenue.ts の coverage) の AdSense の行。読めなければ null */
  adsenseCoverage: { state: "measured" | "unmeasured"; note: string } | null;
  /** data/products/admin-stat-interviews.json から導いた、行政向け商品の検証の進み具合 */
  adminStatPilot: AdminStatPilotProgress;
}

export interface GateView extends GateRow {
  state: GateState;
  /** 判定元の名前 (どの state・関数の値か)。無ければ「なし」 */
  source: string;
  /** 判定元の明細を見る画面。無ければ null */
  href: string | null;
  note: string;
  /** note の下に 1 行ずつ並べる明細 (行政向け商品の検証の件数・段階・次の判断点)。無ければ空 */
  details: string[];
}

export interface GateBoard {
  rows: GateView[];
  /** 表の行と判定元の対応の食い違い (行の増減) */
  issues: string[];
}

type Judgment = Pick<GateView, "state" | "source" | "href" | "note"> & { details?: string[] };

const EXPECTED_HEADER = ["Gate", "通過条件", "未達時"];
const READY = "ready";

/** `[`文書.md`](./文書.md)` → 文書.md。強調とコード記法も外す */
function plainText(cell: string): string {
  return cell
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*|`/g, "")
    .trim();
}

/** mdTableAfter (state-io) の結果を行にする。列の見出しが変わっていたら読まない */
export function gateRowsFromTable(table: { header: string[]; rows: string[][] } | null): GateRow[] {
  if (!table) throw new Error("収益化戦略 §5 にゲートの表が無い");
  if (table.header.join("|") !== EXPECTED_HEADER.join("|")) {
    throw new Error(`収益化戦略 §5 のゲート表の列が変わった: ${table.header.join(" / ")} (想定 ${EXPECTED_HEADER.join(" / ")})`);
  }
  return table.rows.map(([name, passCondition, onFail]) => ({
    name: plainText(name ?? ""),
    passCondition: plainText(passCondition ?? ""),
    onFail: plainText(onFail ?? ""),
  }));
}

function fromGate(gate: GateStatus | null, source: string, href: string): Judgment {
  if (!gate) return { state: "no-source", source, href, note: "判定元の state を読めない" };
  if (!gate.status || gate.status === "unknown") return { state: "no-source", source, href, note: "判定元の state に status が無い" };
  const at = gate.generatedAt ? `・${gate.generatedAt.slice(0, 10)} 時点` : "";
  const reasons = gate.reasons.length ? `: ${gate.reasons.join(" / ")}` : "";
  return { state: gate.status === READY ? "pass" : "fail", source, href, note: `status=${gate.status}${reasons}${at}` };
}

const noSource = (note: string): Judgment => ({ state: "no-source", source: "なし", href: null, note });

const SOURCES: Record<GateName, (inp: GateInputs) => Judgment> = {
  計測: (inp) => fromGate(inp.measurementGate, "アフィリエイト運用の measurementGate", "/affiliate"),
  AdSense: (inp) => {
    const source = "売上の計測範囲 (AdSense)";
    const c = inp.adsenseCoverage;
    if (!c) return { state: "no-source", source, href: "/revenue", note: "判定元の state を読めない" };
    return { state: c.state === "measured" ? "pass" : "fail", source, href: "/revenue", note: `${c.state}: ${c.note}` };
  },
  アフィ横展開: (inp) => fromGate(inp.pilotReadiness, "アフィリエイト pilot の readiness", "/affiliate"),
  トラフィック拡大: () => noSource("T1〜T4 のどの段階にいるかを決める判定関数・state が無い (マーケティング戦略の表は文書だけ)"),
  商品横展開: () => noSource("pilot 判定ボードは指標と判定日だけを持ち、停止条件を持たない"),
  B2B基盤: ({ adminStatPilot: p }) => ({
    state: "no-source",
    source: "行政向け商品の聞き取り台帳 (進み具合だけ)",
    href: null,
    note: "通過・未達を決める記録 (支払者・購入条件の確定、有償取引の需要) を置く欄が台帳に無い",
    details: [
      `聞き取り: ${p.interviewCount}`,
      `段階: ${p.stage}`,
      `次の判断点: ${p.nextDecision}`,
      `有料 pilot の初回判断点 (開始から 30 日): ${p.paidPilotDecision}`,
      ...p.gaps.map((gap) => `台帳の欠け: ${gap}`),
    ],
  }),
};

const isGateName = (name: string): name is GateName => (GATE_NAMES as readonly string[]).includes(name);

export function buildGateBoard(rows: GateRow[], inputs: GateInputs): GateBoard {
  const views = rows.map((row): GateView => {
    const judgment = isGateName(row.name) ? SOURCES[row.name](inputs) : noSource("表に増えた行。判定元の対応が未定義");
    return { ...row, details: [], ...judgment };
  });
  const names = rows.map((r) => r.name);
  const added = names.filter((n) => !isGateName(n));
  const removed = GATE_NAMES.filter((n) => !names.includes(n));
  return {
    rows: views,
    issues: [
      ...(added.length ? [`ゲート表に行が増えた: ${added.join("・")} (判定元の対応が未定義)`] : []),
      ...(removed.length ? [`ゲート表から行が消えた: ${removed.join("・")}`] : []),
    ],
  };
}
