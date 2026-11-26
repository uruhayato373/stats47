import { createElement } from "react";

import { FileText, LayoutGrid, ListOrdered } from "lucide-react";

import { RAIL_ROW_KIND_TONE, type RailRowKind } from "./rail-row-kind.palette";

const KIND_ICON = {
  theme: LayoutGrid,
  survey: FileText,
  ranking: ListOrdered,
} as const;

/**
 * 右レールの行の左端に置く、種類ごとの色付きの四角とアイコン (`RailNavRow` の leading に渡す)。
 * 分野のアイコンは同じ分野の行で全部同じになり見分けに使えなかった (2026-11-26 オーナー指摘) ので、
 * 行が「テーマ」「調査」「ランキング」のどれかを形と色で示す。
 */
export function RailRowKindIcon({ kind }: { kind: RailRowKind }) {
  return (
    <span className={`flex size-7 items-center justify-center rounded-md ${RAIL_ROW_KIND_TONE[kind]}`}>
      {createElement(KIND_ICON[kind])}
    </span>
  );
}
