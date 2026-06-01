"use client";

import { useEffect, useMemo, useState } from "react";

import type { MigrationFlowData, MigrationPartner } from "@stats47/migration-flow";

/** 焦点県 Sankey 図: 左=流入元 / 中央=焦点県 / 右=流出先。幅=年間移動者数。 */

const VIEW_W = 1000;
const PAD_TOP = 70;
const PAD_BOT = 44;
const LABEL_GUTTER = 152;
const NODE_W = 14;
const FOCUS_W = 40;
const FONT = 15;
const NODE_GAP = 6;
const TOP_N = 10;
/** 細いリボンでもラベルが重ならないための最小行送り */
const LABEL_ADV = FONT + 3;
const IN_COLOR = "#2563eb"; // 流入 = 青
const OUT_COLOR = "#ea580c"; // 流出 = 橙

const X_LEFT_NODE = LABEL_GUTTER;
const X_RIGHT_NODE = VIEW_W - LABEL_GUTTER - NODE_W;
const X_FOCUS_LEFT = Math.round(VIEW_W / 2 - FOCUS_W / 2);
const X_FOCUS_RIGHT = X_FOCUS_LEFT + FOCUS_W;

interface SankeyNode {
  name: string;
  value: number;
}

/** 上位 TOP_N + その他 に集約 */
function topWithOther(
  partners: MigrationPartner[],
  key: "inflow" | "outflow",
): SankeyNode[] {
  const sorted = [...partners].sort((a, b) => b[key] - a[key]);
  const head = sorted.slice(0, TOP_N).map((p) => ({ name: p.name, value: p[key] }));
  const tail = sorted.slice(TOP_N);
  const otherSum = tail.reduce((s, p) => s + p[key], 0);
  if (otherSum > 0) head.push({ name: `その他${tail.length}県`, value: otherSum });
  return head;
}

function columnHeight(nodes: SankeyNode[], scale: number): number {
  let h = 0;
  nodes.forEach((n, i) => {
    h += Math.max(n.value * scale, LABEL_ADV);
    if (i < nodes.length - 1) h += NODE_GAP;
  });
  return h;
}

/** Sankey リボンの塗り path */
function ribbonPath(
  x0: number,
  y0a: number,
  y0b: number,
  x1: number,
  y1a: number,
  y1b: number,
): string {
  const xm = (x0 + x1) / 2;
  return [
    `M${x0},${y0a}`,
    `C${xm},${y0a} ${xm},${y1a} ${x1},${y1a}`,
    `L${x1},${y1b}`,
    `C${xm},${y1b} ${xm},${y0b} ${x0},${y0b}`,
    "Z",
  ].join(" ");
}

interface LaidNode extends SankeyNode {
  y: number;
  h: number;
}

interface SankeyModel {
  viewH: number;
  focusTop: number;
  focusH: number;
  inNodes: LaidNode[];
  outNodes: LaidNode[];
  inRibbons: string[];
  outRibbons: string[];
  totals: { inflow: number; outflow: number; net: number };
  focusName: string;
  year: number;
}

function buildModel(data: MigrationFlowData): SankeyModel {
  const inNodes = topWithOther(data.partners, "inflow");
  const outNodes = topWithOther(data.partners, "outflow");
  const totalIn = data.partners.reduce((s, p) => s + p.inflow, 0);
  const totalOut = data.partners.reduce((s, p) => s + p.outflow, 0);
  const maxTotal = Math.max(totalIn, totalOut, 1);

  // 縦は viewBox 内に収める。usableH にちょうど収まる scale を二分探索
  const usableH = 616; // VIEW_H(720) - PAD_TOP - PAD_BOT を基準に固定
  const colMaxAt = (s: number) =>
    Math.max(columnHeight(inNodes, s), columnHeight(outNodes, s), maxTotal * s);
  let lo = 0;
  let hi = usableH / maxTotal;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (colMaxAt(mid) > usableH) hi = mid;
    else lo = mid;
  }
  const scale = lo;
  const colMaxH = colMaxAt(scale);
  const viewH = PAD_TOP + colMaxH + PAD_BOT;

  const layout = (nodes: SankeyNode[]): LaidNode[] => {
    const colH = columnHeight(nodes, scale);
    let y = PAD_TOP + (colMaxH - colH) / 2;
    return nodes.map((n) => {
      const h = n.value * scale;
      const laid: LaidNode = { ...n, y, h };
      y += Math.max(h, LABEL_ADV) + NODE_GAP;
      return laid;
    });
  };
  const inLaid = layout(inNodes);
  const outLaid = layout(outNodes);

  const focusH = maxTotal * scale;
  const focusTop = PAD_TOP + (colMaxH - focusH) / 2;

  // リボンは焦点ノードの辺に「実数の幅」で積む（左=流入 totalIn / 右=流出 totalOut）
  let inAttachY = focusTop + (focusH - totalIn * scale) / 2;
  const inRibbons = inLaid.map((n) => {
    const d = ribbonPath(
      X_LEFT_NODE + NODE_W,
      n.y,
      n.y + n.h,
      X_FOCUS_LEFT,
      inAttachY,
      inAttachY + n.h,
    );
    inAttachY += n.h;
    return d;
  });
  let outAttachY = focusTop + (focusH - totalOut * scale) / 2;
  const outRibbons = outLaid.map((n) => {
    const d = ribbonPath(
      X_FOCUS_RIGHT,
      outAttachY,
      outAttachY + n.h,
      X_RIGHT_NODE,
      n.y,
      n.y + n.h,
    );
    outAttachY += n.h;
    return d;
  });

  return {
    viewH,
    focusTop,
    focusH,
    inNodes: inLaid,
    outNodes: outLaid,
    inRibbons,
    outRibbons,
    totals: { inflow: totalIn, outflow: totalOut, net: totalIn - totalOut },
    focusName: data.focusName,
    year: data.year,
  };
}

const fmt = (n: number) => n.toLocaleString("ja-JP");

interface Props {
  /** 焦点県の 2 桁コード */
  code: string;
}

export function MigrationSankey({ code }: Props) {
  const [data, setData] = useState<{ code: string; data: MigrationFlowData } | null>(
    null,
  );
  const [errored, setErrored] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/migration-flow/${code}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<MigrationFlowData>;
      })
      .then((d) => {
        if (!cancelled) {
          setData({ code, data: d });
          setErrored(null);
        }
      })
      .catch(() => {
        if (!cancelled) setErrored(code);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const ready = data?.code === code;
  const model = useMemo(
    () => (ready && data ? buildModel(data.data) : null),
    [ready, data],
  );

  if (errored === code) {
    return (
      <div className="flex aspect-[3/2] w-full items-center justify-center rounded-md border bg-slate-50 text-sm text-slate-500 dark:bg-slate-900">
        データを読み込めませんでした。
      </div>
    );
  }
  if (!model) {
    return (
      <div className="flex aspect-[3/2] w-full items-center justify-center rounded-md border bg-slate-50 text-sm text-slate-500 dark:bg-slate-900">
        読み込み中…
      </div>
    );
  }

  const net = model.totals.net;
  const netColor = net >= 0 ? IN_COLOR : OUT_COLOR;

  return (
    <div className="w-full overflow-hidden rounded-md border bg-white dark:bg-slate-950">
      <svg
        viewBox={`0 0 ${VIEW_W} ${model.viewH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${model.focusName}の人口移動フロー図（${model.year}年）`}
      >
        {/* タイトル */}
        <text
          x={VIEW_W / 2}
          y={30}
          textAnchor="middle"
          fontSize={22}
          fontWeight={700}
          className="fill-slate-900 dark:fill-slate-100"
        >
          {model.focusName} 人口移動フロー（{model.year}年）
        </text>
        <text
          x={VIEW_W / 2}
          y={52}
          textAnchor="middle"
          fontSize={13}
          className="fill-slate-500 dark:fill-slate-400"
        >
          左: 流入元 → 中央: {model.focusName} → 右: 流出先（幅=人数 / 上位{TOP_N}＋その他）
        </text>

        {/* 流入リボン */}
        {model.inRibbons.map((d, i) => (
          <path key={`ir-${i}`} d={d} fill={IN_COLOR} fillOpacity={0.4} />
        ))}
        {/* 流出リボン */}
        {model.outRibbons.map((d, i) => (
          <path key={`or-${i}`} d={d} fill={OUT_COLOR} fillOpacity={0.4} />
        ))}

        {/* 焦点ノード */}
        <rect
          x={X_FOCUS_LEFT}
          y={model.focusTop}
          width={FOCUS_W}
          height={model.focusH}
          rx={3}
          className="fill-slate-800 dark:fill-slate-200"
        />
        <text
          x={X_FOCUS_LEFT + FOCUS_W / 2}
          y={model.focusTop - 22}
          textAnchor="middle"
          fontSize={FONT + 3}
          fontWeight={700}
          className="fill-slate-900 dark:fill-slate-100"
        >
          {model.focusName}
        </text>
        <text
          x={X_FOCUS_LEFT + FOCUS_W / 2}
          y={model.focusTop - 6}
          textAnchor="middle"
          fontSize={FONT}
          fontWeight={700}
          fill={netColor}
        >
          純移動 {net >= 0 ? "+" : ""}
          {fmt(net)}
        </text>

        {/* 左ノード（流入元） */}
        {model.inNodes.map((n, i) => (
          <g key={`in-${i}`}>
            <rect
              x={X_LEFT_NODE}
              y={n.y}
              width={NODE_W}
              height={Math.max(n.h, 1.5)}
              rx={2}
              fill={IN_COLOR}
            />
            <text
              x={X_LEFT_NODE - 6}
              y={n.y + n.h / 2 + FONT * 0.35}
              textAnchor="end"
              fontSize={FONT}
              className="fill-slate-700 dark:fill-slate-300"
            >
              {n.name}{" "}
              <tspan className="fill-slate-400 dark:fill-slate-500">{fmt(n.value)}</tspan>
            </text>
          </g>
        ))}

        {/* 右ノード（流出先） */}
        {model.outNodes.map((n, i) => (
          <g key={`out-${i}`}>
            <rect
              x={X_RIGHT_NODE}
              y={n.y}
              width={NODE_W}
              height={Math.max(n.h, 1.5)}
              rx={2}
              fill={OUT_COLOR}
            />
            <text
              x={X_RIGHT_NODE + NODE_W + 6}
              y={n.y + n.h / 2 + FONT * 0.35}
              textAnchor="start"
              fontSize={FONT}
              className="fill-slate-700 dark:fill-slate-300"
            >
              {n.name}{" "}
              <tspan className="fill-slate-400 dark:fill-slate-500">{fmt(n.value)}</tspan>
            </text>
          </g>
        ))}

        {/* フッター */}
        <text
          x={VIEW_W / 2}
          y={model.viewH - 16}
          textAnchor="middle"
          fontSize={12}
          className="fill-slate-400 dark:fill-slate-500"
        >
          総流入 {fmt(model.totals.inflow)}／総流出 {fmt(model.totals.outflow)}／純 {net >= 0 ? "+" : ""}
          {fmt(net)}　出典: e-Stat 住民基本台帳人口移動報告（{model.year}）
        </text>
      </svg>
    </div>
  );
}
