"use client";

import { useMemo, useRef } from "react";

import { estimateTextWidth, useReadableFontSize } from "@stats47/visualization";

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
  /**
   * 外枠と SVG 内テキストの扱い。
   * - `card`(既定): 自前のカード枠 + SVG 内に title/subtitle/footer を描く
   * - `bare`: 枠なし・title/subtitle/footer を描かない。`ChartPanel` の
   *   ヘッダー/フッターに委ねる場合に使う(見出しと出典の二重表示を避ける)
   */
  chrome?: "card" | "bare";
  /**
   * ノード列に使う viewBox 上の高さ。小さくすると縦横比が横長になる。
   * 2 カラムに並べる場合は他チャートと縦横比を揃えるため小さくする。
   */
  usableHeight?: number;
}

const VIEW_W = 1000;
/** card: SVG 内 title/subtitle の分だけ上を空ける。bare: 中央ノードのラベル 2 行分だけ */
const PAD_TOP = { card: 70, bare: 40 } as const;
const PAD_BOT = { card: 44, bare: 16 } as const;
const NODE_W = 14;
const FOCUS_W = 40;
/** 等倍表示での文字サイズ (viewBox 単位)。縮小表示では画面上で読める大きさまで上げる */
const FONT = 15;
const NODE_GAP = 6;
const DEFAULT_USABLE_H = 616;
/** ラベルとノードの間隔 */
const LABEL_GAP = 6;
/** ラベルと viewBox の端の間に残す幅 */
const LABEL_EDGE_PAD = 4;
/** 流れの帯 (ノードと中央のノードの間) に残す幅の下限。ラベルの列をこれ以上は広げない */
const MIN_RIBBON_W = 60;
const MAX_LABEL_GUTTER = VIEW_W / 2 - FOCUS_W / 2 - NODE_W - MIN_RIBBON_W;
/** 1 行のラベルの列がこの幅を超えるときは、名前と値を 2 行に分ける (帯の幅を残すため) */
const SINGLE_LINE_MAX_GUTTER = 300;
/** 2 行のラベルの行送り (文字サイズに対する比) */
const STACKED_LINE_HEIGHT = 1.15;
/** ノードの列の高さに対して、ラベルを並べるのに最低限要る高さへ足す余裕 (帯の太さの差を残す) */
const LABEL_COLUMN_HEADROOM = 1.25;

/** 文字サイズから決まる寸法。等倍 (font = FONT) では従来の値になる */
interface HubMetrics {
  font: number;
  /** 等倍の文字サイズに対する倍率。SVG 内の文字と余白をこの倍率で広げる */
  k: number;
  /** 名前と値を 2 行に分けるか (狭い幅) */
  stacked: boolean;
  /** ラベル 1 件が縦に占める高さ (ノードがこれより低くても行はこの高さを取る) */
  labelAdv: number;
  labelGutter: number;
  usableH: number;
  padTop: number;
  padBot: number;
}

function hubMetrics(
  font: number,
  leftNodes: HubNode[],
  rightNodes: HubNode[],
  formatValue: (n: number) => string,
  labelGutter: number,
  chrome: "card" | "bare",
  usableHeight: number,
): HubMetrics {
  const k = font / FONT;
  const nodes = [...leftNodes, ...rightNodes];
  const widest = (measure: (node: HubNode) => number) =>
    Math.ceil(Math.max(0, ...nodes.map(measure))) + LABEL_GAP + LABEL_EDGE_PAD;

  // 1 行 (名前 値) で収まる列の幅。呼び出し側の指定より長いラベルがあれば、切れないよう広げる
  const singleLineGutter = Math.max(
    labelGutter * k,
    widest((node) => estimateTextWidth(`${node.name} ${formatValue(node.value)}`, font)),
  );
  const stacked = singleLineGutter > SINGLE_LINE_MAX_GUTTER;
  const gutter = stacked
    ? widest((node) =>
        Math.max(estimateTextWidth(node.name, font), estimateTextWidth(formatValue(node.value), font)),
      )
    : singleLineGutter;

  const labelAdv = stacked ? Math.ceil(font * STACKED_LINE_HEIGHT * 2) + 3 : font + 3;
  const rows = Math.max(leftNodes.length, rightNodes.length);
  const minColumnHeight = rows * labelAdv + Math.max(0, rows - 1) * NODE_GAP;

  return {
    font,
    k,
    stacked,
    labelAdv,
    labelGutter: Math.min(MAX_LABEL_GUTTER, gutter),
    // 文字を大きくした分だけ縦に伸ばす。等倍では呼び出し側の高さのまま
    usableH: k > 1 ? Math.max(usableHeight * k, minColumnHeight * LABEL_COLUMN_HEADROOM) : usableHeight,
    padTop: PAD_TOP[chrome] * k,
    padBot: PAD_BOT[chrome] * k,
  };
}

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

function colHeight(nodes: HubNode[], scale: number, labelAdv: number): number {
  let h = 0;
  nodes.forEach((n, i) => {
    h += Math.max(n.value * scale, labelAdv);
    if (i < nodes.length - 1) h += NODE_GAP;
  });
  return h;
}

/** レイアウト計算は render scope の外(純関数)で行い、状態の再代入 lint を回避する。 */
function buildHubModel(
  leftNodes: HubNode[],
  rightNodes: HubNode[],
  metrics: HubMetrics,
): HubModel {
  const { padTop, padBot, labelGutter, usableH, labelAdv } = metrics;
  const xLeftNode = labelGutter;
  const xRightNode = VIEW_W - labelGutter - NODE_W;
  const xFocusLeft = Math.round(VIEW_W / 2 - FOCUS_W / 2);
  const xFocusRight = xFocusLeft + FOCUS_W;

  const totalLeft = leftNodes.reduce((s, n) => s + n.value, 0);
  const totalRight = rightNodes.reduce((s, n) => s + n.value, 0);
  const maxTotal = Math.max(totalLeft, totalRight, 1);

  const colMaxAt = (s: number) =>
    Math.max(colHeight(leftNodes, s, labelAdv), colHeight(rightNodes, s, labelAdv), maxTotal * s);

  let lo = 0;
  let hi = usableH / maxTotal;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (colMaxAt(mid) > usableH) hi = mid;
    else lo = mid;
  }
  const scale = lo;
  const colMaxH = colMaxAt(scale);
  const viewH = padTop + colMaxH + padBot;

  const layout = (nodes: HubNode[], xNode: number, isLeft: boolean): LaidNode[] => {
    const colH = colHeight(nodes, scale, labelAdv);
    let y = padTop + (colMaxH - colH) / 2;
    return nodes.map((n) => {
      const h = n.value * scale;
      const laid: LaidNode = { ...n, y, h, xr: isLeft ? xNode + NODE_W : xNode };
      y += Math.max(h, labelAdv) + NODE_GAP;
      return laid;
    });
  };
  const left = layout(leftNodes, xLeftNode, true);
  const right = layout(rightNodes, xRightNode, false);

  const focusH = maxTotal * scale;
  const focusTop = padTop + (colMaxH - focusH) / 2;

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
  chrome = "card",
  usableHeight = DEFAULT_USABLE_H,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 幅 1000 の viewBox をスマホの幅に縮めると 15 の文字が約 4px になる。表示幅から文字サイズを逆算する
  const font = useReadableFontSize(containerRef, VIEW_W, FONT);
  const metrics = useMemo(
    () => hubMetrics(font, leftNodes, rightNodes, formatValue, labelGutter, chrome, usableHeight),
    [font, leftNodes, rightNodes, formatValue, labelGutter, chrome, usableHeight],
  );
  const model = useMemo(
    () => buildHubModel(leftNodes, rightNodes, metrics),
    [leftNodes, rightNodes, metrics],
  );
  const bare = chrome === "bare";
  const { k, stacked, labelAdv } = metrics;
  // 中央のラベルの基準の高さ。狭い幅では文字が帯の列の幅いっぱいに広がるので、帯に重ならないよう
  // ノードの列の上端 (padTop) より上に置く。等倍では従来どおり中央のノードのすぐ上
  const centerLabelBase = stacked ? Math.min(model.focusTop, metrics.padTop) : model.focusTop;

  /** ノードの横のラベル。狭い幅では名前と値を 2 行に分け、行 (ノードが低くても labelAdv の高さ) の中央に置く */
  const nodeLabel = (n: LaidNode, x: number, anchor: "start" | "end") => {
    if (!stacked) {
      return (
        <text
          x={x}
          y={n.y + n.h / 2 + font * 0.35}
          textAnchor={anchor}
          fontSize={font}
          className="fill-foreground"
        >
          {n.name}{" "}
          <tspan className="fill-muted-foreground">{formatValue(n.value)}</tspan>
        </text>
      );
    }
    const firstBaseline = n.y + Math.max(n.h, labelAdv) / 2 - font * 0.2;
    return (
      <text x={x} y={firstBaseline} textAnchor={anchor} fontSize={font} className="fill-foreground">
        <tspan x={x}>{n.name}</tspan>
        <tspan x={x} dy={font * STACKED_LINE_HEIGHT} className="fill-muted-foreground">
          {formatValue(n.value)}
        </tspan>
      </text>
    );
  };

  return (
    <div
      ref={containerRef}
      className={
        bare ? "w-full" : "w-full overflow-hidden rounded-card border bg-card"
      }
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${model.viewH}`}
        className="h-auto w-full"
        role="img"
        aria-label={title}
      >
        {!bare && (
          <>
            <text
              x={VIEW_W / 2}
              y={30 * k}
              textAnchor="middle"
              fontSize={22 * k}
              fontWeight={700}
              className="fill-foreground"
            >
              {title}
            </text>
            <text
              x={VIEW_W / 2}
              y={52 * k}
              textAnchor="middle"
              fontSize={13 * k}
              className="fill-muted-foreground"
            >
              {subtitle}
            </text>
          </>
        )}

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
          className="fill-foreground"
        />
        <text
          x={model.xFocusLeft + FOCUS_W / 2}
          y={centerLabelBase - 22 * k}
          textAnchor="middle"
          fontSize={(FONT + 3) * k}
          fontWeight={700}
          className="fill-foreground"
        >
          {centerLabel}
        </text>
        <text
          x={model.xFocusLeft + FOCUS_W / 2}
          y={centerLabelBase - 6 * k}
          textAnchor="middle"
          fontSize={font}
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
            {nodeLabel(n, model.xLeftNode - LABEL_GAP, "end")}
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
            {nodeLabel(n, model.xRightNode + NODE_W + LABEL_GAP, "start")}
          </g>
        ))}

        {footer && !bare && (
          <text
            x={VIEW_W / 2}
            y={model.viewH - 16 * k}
            textAnchor="middle"
            fontSize={12 * k}
            className="fill-muted-foreground"
          >
            {footer}
          </text>
        )}
      </svg>
    </div>
  );
}
