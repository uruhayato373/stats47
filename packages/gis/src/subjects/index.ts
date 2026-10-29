/**
 * 主題の台帳 (`data/geo/subjects/subjects.json`) を読んで型を付ける。主題 = 原典のデータ 1 つを地図にどう描くかの定義
 * (英語 subject。サイトの「テーマ」theme とは別物)。台帳の正本は JSON で、形は同じ場所の JSON Schema、
 * dataId・metricKey の実在は `npm run check-datasets` の refs が検査する。ここは型と選択の正規化だけを持つ。
 */
import subjectsJson from "../../../../data/geo/subjects/subjects.json";

import type { KsjClassColor } from "../mlit-ksj/classifications";

export type GeoSubjectGeometry = "line" | "point" | "area";
export type GeoSubjectScopeKind = "national" | "region" | "prefecture";

export type GeoSubjectSource =
  | { readonly kind: "ksj"; readonly dataId: string; readonly featureType: string }
  | { readonly kind: "estat-metric"; readonly metricKey: string; readonly entity: "prefecture" | "city" };

export interface GeoSubjectClass {
  readonly code: string;
  readonly label: string;
  readonly sourceCodes: readonly string[];
  readonly color: KsjClassColor;
}

export type GeoSubjectStyle =
  | { readonly kind: "category"; readonly classes: readonly GeoSubjectClass[] }
  | { readonly kind: "sequential"; readonly scale: "linear" | "log" }
  /** 正負で色を分ける (増加 = --positive、減少 = --negative) */
  | { readonly kind: "diverging" }
  | { readonly kind: "single"; readonly color: KsjClassColor };

export interface GeoSubject {
  readonly id: string;
  readonly label: string;
  readonly geometry: GeoSubjectGeometry;
  readonly source: GeoSubjectSource;
  readonly time: {
    readonly axis: "annual" | "fiscal-annual" | "census-5y" | "snapshot";
    readonly match: "validity-range" | "exact" | "latest-before";
  };
  readonly geography: {
    readonly unit: "segment" | "facility" | "municipality" | "prefecture" | "site";
    readonly boundary: "municipality-merged-designated-city" | null;
  };
  readonly scopes: readonly GeoSubjectScopeKind[];
  readonly measure: { readonly label: string; readonly unit: string } | null;
  readonly style: GeoSubjectStyle;
  /** 原典の値から導いた値を描く (例: 基準年からの増減率) */
  readonly derive?: { readonly kind: "change-rate-from-base-year"; readonly baseYear: number };
  readonly notes?: readonly string[];
  readonly unverified?: readonly string[];
}

export const GEO_SUBJECTS: readonly GeoSubject[] = (subjectsJson as { subjects: GeoSubject[] }).subjects;

const SUBJECTS_BY_ID = new Map(GEO_SUBJECTS.map((subject) => [subject.id, subject]));

export function findGeoSubject(id: string): GeoSubject | null {
  return SUBJECTS_BY_ID.get(id) ?? null;
}

/** 重ねるものの順 (下から)。線の上に点 */
const GEOMETRY_ORDER: Record<GeoSubjectGeometry, number> = { area: 0, line: 1, point: 2 };

/** unknown: 台帳に無い / duplicate: 重複 / scope: この範囲では描かない / kind: 背景と重ねるものの取り違え */
export type GeoSubjectDropReason = "unknown" | "duplicate" | "scope" | "kind";

export interface GeoMapSubjectSelection {
  /** 背景 (塗り分け)。1 つだけ */
  readonly base: GeoSubject | null;
  /** 重ねるもの (線・点)。重ねる順 (線 → 点、同じ形は指定順) */
  readonly overlays: readonly GeoSubject[];
  readonly dropped: readonly { id: string; reason: GeoSubjectDropReason }[];
}

/**
 * URL の base= (背景の塗り分け 1 つ) と subjects= (重ねる線・点) を正規化する。塗り分けは同時に 1 つまでなので、
 * 背景は値を 1 つしか持てない base= で受ける。台帳に無い ID・重複・範囲で描けない主題・背景と重ねるものの取り違えは外し、
 * 理由と一緒に返す (手で URL を書いたときだけ起きる)。
 */
export function normalizeGeoMapSubjects(
  baseId: string | null,
  overlayIds: readonly string[],
  scopeKind: GeoSubjectScopeKind,
): GeoMapSubjectSelection {
  const dropped: { id: string; reason: GeoSubjectDropReason }[] = [];
  let base: GeoSubject | null = null;
  if (baseId !== null) {
    const subject = SUBJECTS_BY_ID.get(baseId);
    if (!subject) dropped.push({ id: baseId, reason: "unknown" });
    else if (subject.geometry !== "area") dropped.push({ id: baseId, reason: "kind" });
    else if (!subject.scopes.includes(scopeKind)) dropped.push({ id: baseId, reason: "scope" });
    else base = subject;
  }
  const overlays: GeoSubject[] = [];
  for (const id of overlayIds) {
    const subject = SUBJECTS_BY_ID.get(id);
    if (!subject) dropped.push({ id, reason: "unknown" });
    else if (overlays.includes(subject)) dropped.push({ id, reason: "duplicate" });
    else if (subject.geometry === "area") dropped.push({ id, reason: "kind" });
    else if (!subject.scopes.includes(scopeKind)) dropped.push({ id, reason: "scope" });
    else overlays.push(subject);
  }
  const ordered = overlays
    .map((subject, index) => ({ subject, index }))
    .sort((x, y) => GEOMETRY_ORDER[x.subject.geometry] - GEOMETRY_ORDER[y.subject.geometry] || x.index - y.index)
    .map(({ subject }) => subject);
  return { base, overlays: ordered, dropped };
}

/** 原典のコード値から表示の区分を引く (区分で色分けする主題だけ)。区分に入らない値は null */
export function geoSubjectClassOf(subject: GeoSubject, sourceCode: unknown): GeoSubjectClass | null {
  if (subject.style.kind !== "category" || sourceCode === undefined || sourceCode === null || sourceCode === "") return null;
  const code = String(sourceCode);
  return subject.style.classes.find((item) => item.sourceCodes.includes(code)) ?? null;
}
