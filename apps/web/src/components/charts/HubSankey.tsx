"use client";

import { useMemo } from "react";

/**
 * 焦点 hub 型 Sankey の純描画コンポーネント。
 * 左ノード群 → 中央ノード → 右ノード群 の流れを、幅=value のベジェ・リボンで表す。
 * データ取得・集計は呼び出し側が行い、確定した leftNodes / rightNodes を渡す
 * (人口移動フロー・財政フローなど複数 feature で共有)。
 */

export interface HubNode {
  name: string;
  value: number;
}

interface Props {
  title: string;
  subtitle: string;
  /** 中央ノードのラベル(県名 / 「一般会計」など) */
  centerLabel: string;
  /** 中央ノード上の補足(純移動 / 歳入歳出など) */
  centerSub: string;
  /** centerSub の文字色(hex) */
  centerSubColor: string;
  leftNodes: HubNode[];
  rightNodes: HubNode[];
  leftColor: string;
  rightColor: string;
  formatValue: (n: number) => string;
  footer?: string;
  /** 県名ラベル用の左右余白(viewBox 単位)。長いラベル時に拡張 */
  labelGutter?: number;
}

const VIEW_W = 1000;
const PAD_TOP = 70;
const PAD_BOT = 44;
const NODE_W = 14;
const FOCUS_W = 40;
const FONT = 15;
const NODE_GAP = 6;
const LABEL_ADV = FONT + 3;
const USABLE_H = 616;

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

interface LaidNode extends HubNode {
  y: number;
  h: number;
  xr: number;
}

interface HubModel {
  viewH: number;
  focusTop: number;
  focusH: number;
  left: LaidNode[];
  right: LaidNode[];
  leftRibbons: string[];
  rightRibbons: string[];
  xLeftNode: number;
  xRightNode: number;
  xFocusLeft: number;
  xFocusRight: number;
}

function colHeight(nodes: HubNode[], scale: number): number {
  let h = 0;
  nodes.forEach((n, i) => {
    h += Math.max(n.value * scale, LABEL_ADV);
    if (i < nodes.length - 1) h += NODE_GAP;
  });
  return h;
}

/** レイアウト計算は render scope の外(純関数)で行い、状態の再代入 lint を回避する。 */
function buildHubModel(
  leftNodes: HubNode[],
  rightNodes: HubNode[],
  labelGutter: number,
): HubModel {
  const xLeftNode = labelGutter;
  const xRightNode = VIEW_W - labelGutter - NODE_W;
  const xFocusLeft = Math.round(VIEW_W / 2 - FOCUS_W / 2);
  const xFocusRight = xFocusLeft + FOCUS_W;

  const totalLeft = leftNodes.reduce((s, n) => s + n.value, 0);
  const totalRight = rightNodes.reduce((s, n) => s + n.value, 0);
  const maxTotal = Math.max(totalLeft, totalRight, 1);

  const colMaxAt = (s: number) =>
    Math.max(colHeight(leftNodes, s), colHeight(rightNodes, s), maxTotal * s);

  let lo = 0;
  let hi = USABLE_H / maxTotal;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (colMaxAt(mid) > USABLE_H) hi = mid;
    else lo = mid;
  }
  const scale = lo;
  const colMaxH = colMaxAt(scale);
  const viewH = PAD_TOP + colMaxH + PAD_BOT;

  const layout = (nodes: HubNode[], xNode: number, isLeft: boolean): LaidNode[] => {
    const colH = colHeight(nodes, scale);
    let y = PAD_TOP + (colMaxH - colH) / 2;
    return nodes.map((n) => {
      const h = n.value * scale;
      const laid: LaidNode = { ...n, y, h, xr: isLeft ? xNode + NODE_W : xNode };
      y += Math.max(h, LABEL_ADV) + NODE_GAP;
      return laid;
    });
  };
  const left = layout(leftNodes, xLeftNode, true);
  const right = layout(rightNodes, xRightNode, false);

  const focusH = maxTotal * scale;
  const focusTop = PAD_TOP + (colMaxH - focusH) / 2;

  // リボンは焦点辺に実数幅で積む(累積オフセットは reduce で持つ)
  const inStart = focusTop + (focusH - totalLeft * scale) / 2;
  const leftRibbons: string[] = [];
  left.reduce((acc, n) => {
    leftRibbons.push(ribbonPath(n.xr, n.y, n.y + n.h, xFocusLeft, acc, acc + n.h));
    return acc + n.h;
  }, inStart);

  const outStart = focusTop + (focusH - totalRight * scale) / 2;
  const rightRibbons: string[] = [];
  right.reduce((acc, n) => {
    rightRibbons.push(ribbonPath(xFocusRight, acc, acc + n.h, n.xr, n.y, n.y + n.h));
    return acc + n.h;
  }, outStart);

  return {
    viewH,
    focusTop,
    focusH,
    left,
    right,
    leftRibbons,
    rightRibbons,
    xLeftNode,
    xRightNode,
    xFocusLeft,
    xFocusRight,
  };
}

export function HubSankey({
  title,
  subtitle,
  centerLabel,
  centerSub,
  centerSubColor,
  leftNodes,
  rightNodes,
  leftColor,
  rightColor,
  formatValue,
  footer,
  labelGutter = 152,
}: Props) {
  const model = useMemo(
    () => buildHubModel(leftNodes, rightNodes, labelGutter),
    [leftNodes, rightNodes, labelGutter],
  );

  return (
    <div className="w-full overflow-hidden rounded-md border bg-white dark:bg-slate-950">
      <svg
        viewBox={`0 0 ${VIEW_W} ${model.viewH}`}
        className="h-auto w-full"
        role="img"
        aria-label={title}
      >
        <text
          x={VIEW_W / 2}
          y={30}
          textAnchor="middle"
          fontSize={22}
          fontWeight={700}
          className="fill-slate-900 dark:fill-slate-100"
        >
          {title}
        </text>
        <text
          x={VIEW_W / 2}
          y={52}
          textAnchor="middle"
          fontSize={13}
          className="fill-slate-500 dark:fill-slate-400"
        >
          {subtitle}
        </text>

        {model.leftRibbons.map((d, i) => (
          <path key={`lr-${i}`} d={d} fill={leftColor} fillOpacity={0.4} />
        ))}
        {model.rightRibbons.map((d, i) => (
          <path key={`rr-${i}`} d={d} fill={rightColor} fillOpacity={0.4} />
        ))}

        <rect
          x={model.xFocusLeft}
          y={model.focusTop}
          width={FOCUS_W}
          height={model.focusH}
          rx={3}
          className="fill-slate-800 dark:fill-slate-200"
        />
        <text
          x={model.xFocusLeft + FOCUS_W / 2}
          y={model.focusTop - 22}
          textAnchor="middle"
          fontSize={FONT + 3}
          fontWeight={700}
          className="fill-slate-900 dark:fill-slate-100"
        >
          {centerLabel}
        </text>
        <text
          x={model.xFocusLeft + FOCUS_W / 2}
          y={model.focusTop - 6}
          textAnchor="middle"
          fontSize={FONT}
          fontWeight={700}
          fill={centerSubColor}
        >
          {centerSub}
        </text>

        {model.left.map((n, i) => (
          <g key={`l-${i}`}>
            <rect
              x={model.xLeftNode}
              y={n.y}
              width={NODE_W}
              height={Math.max(n.h, 1.5)}
              rx={2}
              fill={leftColor}
            />
            <text
              x={model.xLeftNode - 6}
              y={n.y + n.h / 2 + FONT * 0.35}
              textAnchor="end"
              fontSize={FONT}
              className="fill-slate-700 dark:fill-slate-300"
            >
              {n.name}{" "}
              <tspan className="fill-slate-400 dark:fill-slate-500">
                {formatValue(n.value)}
              </tspan>
            </text>
          </g>
        ))}

        {model.right.map((n, i) => (
          <g key={`r-${i}`}>
            <rect
              x={model.xRightNode}
              y={n.y}
              width={NODE_W}
              height={Math.max(n.h, 1.5)}
              rx={2}
              fill={rightColor}
            />
            <text
              x={model.xRightNode + NODE_W + 6}
              y={n.y + n.h / 2 + FONT * 0.35}
              textAnchor="start"
              fontSize={FONT}
              className="fill-slate-700 dark:fill-slate-300"
            >
              {n.name}{" "}
              <tspan className="fill-slate-400 dark:fill-slate-500">
                {formatValue(n.value)}
              </tspan>
            </text>
          </g>
        ))}

        {footer && (
          <text
            x={VIEW_W / 2}
            y={model.viewH - 16}
            textAnchor="middle"
            fontSize={12}
            className="fill-slate-400 dark:fill-slate-500"
          >
            {footer}
          </text>
        )}
      </svg>
    </div>
  );
}
