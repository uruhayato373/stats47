import React, { useMemo } from "react";
import type { Topology } from "topojson-specification";

import {
  bezierPath,
  buildArc,
  particlePositions,
  type ArcGeom,
} from "./lib/arc";
import {
  buildMigrationMap,
  type MapRect,
  type RegionFlow,
} from "./lib/build-map";
import { COLOR_SCHEMES, FONT, type ThemeName } from "./theme";
import type { MigrationFlowData, MunicipalityData } from "./types";

/** 24 秒 @ 30fps 相当のフレーム数。Remotion 側の durationInFrames に使う */
export const MIGRATION_FLOW_DURATION = 720;

const WIDTH = 1920;
const HEIGHT = 1080;

/** 地図本体の矩形。外側の余白に地方ラベルを置く */
const MAP_RECT: MapRect = { x0: 190, y0: 108, x1: 1730, y1: 1012 };
const MUNI_LABEL_COUNT = 12;
const MAX_PARTICLES = 14;
const PERIOD = 84;

const IN_COLOR = "#2DD4BF"; // 転入（青緑）— 暗いUI上の数値・凡例用
const OUT_COLOR = "#F4606A"; // 転出（赤）— 同上
// 明るい地図上のパーティクルは濃色でないと埋もれるため別色
const FLOW_IN = "#0D9488"; // 転入パーティクル（濃い青緑）
const FLOW_OUT = "#DC2626"; // 転出パーティクル（濃い赤）
const FOCUS_COLOR = "#D97706"; // 焦点県の輪郭（明るい地図でも視認できる琥珀）
/** 明るい地図パネル背景 */
const MAP_BG = "#E9EDF2";

const fmt = (n: number) => Math.round(n).toLocaleString("ja-JP");
const signed = (n: number) => (n >= 0 ? "+" : "−") + fmt(Math.abs(n));

/** Remotion interpolate の最小実装（2 点・clamp・任意 easing） */
function interp(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  easing?: (t: number) => number,
): number {
  let t = (value - inMin) / (inMax - inMin || 1);
  t = Math.max(0, Math.min(1, t));
  if (easing) t = easing(t);
  return outMin + (outMax - outMin) * t;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/** Remotion AbsoluteFill 相当（Remotion 非依存にするための置換） */
const AbsoluteFill: React.FC<{
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ style, children }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      ...style,
    }}
  >
    {children}
  </div>
);

interface Channel {
  arc: ArcGeom;
  inCount: number;
  outCount: number;
  width: number;
  seed: number;
}

export interface MigrationFlowReelProps {
  /** アニメーションフレーム。Remotion は useCurrentFrame()、Web は rAF で渡す */
  frame: number;
  topology: Topology;
  data: MigrationFlowData;
  cityTopology?: Topology | null;
  municipalities?: MunicipalityData | null;
  theme?: ThemeName;
}

export const MigrationFlowReel: React.FC<MigrationFlowReelProps> = ({
  frame,
  topology,
  data,
  cityTopology,
  municipalities,
  theme = "dark",
}) => {
  const colors = COLOR_SCHEMES[theme];

  const map = useMemo(
    () =>
      buildMigrationMap(topology, data, {
        width: WIDTH,
        height: HEIGHT,
        mapRect: MAP_RECT,
        cityTopology: cityTopology ?? undefined,
        municipalities: municipalities?.municipalities,
      }),
    [topology, data, cityTopology, municipalities],
  );
  const { shapes, municipalityShapes, focusOutlinePath, focusCentroid, regionFlows } =
    map;

  const partnerByCode = useMemo(
    () => new Map(data.partners.map((p) => [p.code, p])),
    [data],
  );

  // 流量スケール（近接県・地方とも共通）
  const maxFlow = useMemo(() => {
    const flows: number[] = [];
    for (const s of shapes) {
      if (!s.near) continue;
      const p = partnerByCode.get(s.code);
      if (p) flows.push(p.inflow, p.outflow);
    }
    for (const r of regionFlows) flows.push(r.inflow, r.outflow);
    return Math.max(1, ...flows);
  }, [shapes, regionFlows, partnerByCode]);

  const maxGross = useMemo(() => {
    const g: number[] = [];
    for (const s of shapes) {
      if (!s.near) continue;
      const p = partnerByCode.get(s.code);
      if (p) g.push(p.inflow + p.outflow);
    }
    for (const r of regionFlows) g.push(r.inflow + r.outflow);
    return Math.max(1, ...g);
  }, [shapes, regionFlows, partnerByCode]);

  const nearChannels = useMemo<Channel[]>(() => {
    if (!focusCentroid) return [];
    const result: Channel[] = [];
    let idx = 0;
    for (const s of shapes) {
      if (!s.near) continue;
      const p = partnerByCode.get(s.code);
      if (!p) continue;
      result.push({
        arc: buildArc(s.centroid, focusCentroid),
        inCount: Math.round(MAX_PARTICLES * Math.sqrt(p.inflow / maxFlow)),
        outCount: Math.round(MAX_PARTICLES * Math.sqrt(p.outflow / maxFlow)),
        width: 1 + 3 * Math.sqrt((p.inflow + p.outflow) / maxGross),
        seed: (idx++ % 7) / 7,
      });
    }
    return result;
  }, [shapes, focusCentroid, partnerByCode, maxFlow, maxGross]);

  const regionChannels = useMemo<Array<Channel & { region: RegionFlow }>>(() => {
    if (!focusCentroid) return [];
    return regionFlows.map((r, idx) => ({
      region: r,
      arc: buildArc(r.anchor, focusCentroid, 0.05),
      inCount: Math.round(MAX_PARTICLES * Math.sqrt(r.inflow / maxFlow)),
      outCount: Math.round(MAX_PARTICLES * Math.sqrt(r.outflow / maxFlow)),
      width: 3 + 13 * Math.sqrt((r.inflow + r.outflow) / maxGross),
      seed: (idx % 5) / 5,
    }));
  }, [regionFlows, focusCentroid, maxFlow, maxGross]);

  const municipalityLabels = useMemo(() => {
    const gross = new Map(
      (municipalities?.municipalities ?? []).map((m) => [
        m.code,
        m.inflow + m.outflow,
      ]),
    );
    const top = [...municipalityShapes]
      .sort((a, b) => (gross.get(b.code) ?? 0) - (gross.get(a.code) ?? 0))
      .slice(0, MUNI_LABEL_COUNT);
    return deOverlapLabels(
      top.map((m) => ({
        code: m.code,
        name: m.name,
        x: m.centroid[0],
        y: m.centroid[1],
      })),
    );
  }, [municipalityShapes, municipalities]);

  const topInflow = useMemo(
    () => [...data.partners].sort((a, b) => b.inflow - a.inflow).slice(0, 5),
    [data],
  );
  const topOutflow = useMemo(
    () => [...data.partners].sort((a, b) => b.outflow - a.outflow).slice(0, 5),
    [data],
  );

  const intro = interp(frame, 0, 24, 0, 1);
  const countT = interp(frame, 12, 70, 0, 1, easeOutCubic);
  const pulse = 1 + 0.13 * Math.sin(frame / 9);

  const allChannels = [...regionChannels, ...nearChannels];

  return (
    <AbsoluteFill
      style={{ backgroundColor: colors.background, fontFamily: FONT.family }}
    >
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <clipPath id="map-clip">
            <rect
              x={MAP_RECT.x0}
              y={MAP_RECT.y0}
              width={MAP_RECT.x1 - MAP_RECT.x0}
              height={MAP_RECT.y1 - MAP_RECT.y0}
            />
          </clipPath>
        </defs>

        {/* 地図パネル背景（明るい） */}
        <rect
          x={MAP_RECT.x0}
          y={MAP_RECT.y0}
          width={MAP_RECT.x1 - MAP_RECT.x0}
          height={MAP_RECT.y1 - MAP_RECT.y0}
          fill={MAP_BG}
          stroke="#94A3B8"
          strokeWidth={1.5}
          rx={10}
        />

        {/* 非焦点県（グレー・地図矩形でクリップ） */}
        <g clipPath="url(#map-clip)">
          {shapes.map((s) => (
            <path
              key={s.code}
              d={s.path}
              fill={s.fill}
              stroke="rgba(71,85,105,0.5)"
              strokeWidth={0.7}
              strokeLinejoin="round"
              opacity={intro}
            />
          ))}
        </g>

        {/* フロー帯・アーク（クリップせず余白のラベルまで届かせる） */}
        {regionChannels.map((ch) => (
          <path
            key={`rband-${ch.region.region}`}
            d={bezierPath(ch.arc)}
            fill="none"
            stroke="rgba(100,116,139,0.22)"
            strokeWidth={ch.width}
            strokeLinecap="round"
            opacity={intro}
          />
        ))}
        {nearChannels.map((ch, i) => (
          <path
            key={`narc-${i}`}
            d={bezierPath(ch.arc)}
            fill="none"
            stroke="rgba(100,116,139,0.3)"
            strokeWidth={ch.width}
            strokeLinecap="round"
            opacity={intro}
          />
        ))}

        {/* 焦点県の市区町村コロプレス（アークの上に描いてグレーかぶりを防ぐ） */}
        <g clipPath="url(#map-clip)">
          {municipalityShapes.map((m) => (
            <path
              key={`muni-${m.code}`}
              d={m.path}
              fill={m.fill}
              stroke="rgba(30,41,59,0.45)"
              strokeWidth={0.8}
              strokeLinejoin="round"
              opacity={intro}
            />
          ))}
          {focusOutlinePath && (
            <path
              d={focusOutlinePath}
              fill="none"
              stroke={FOCUS_COLOR}
              strokeWidth={3.6}
              strokeLinejoin="round"
              opacity={intro}
            />
          )}
        </g>

        {/* パーティクル */}
        {allChannels.map((ch, ci) => (
          <g key={`out-${ci}`}>
            {particlePositions(ch.arc, ch.outCount, frame, PERIOD, "out", ch.seed).map(
              (p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill={FLOW_OUT}
                  opacity={(0.55 + 0.45 * p.fade) * intro}
                />
              ),
            )}
          </g>
        ))}
        {allChannels.map((ch, ci) => (
          <g key={`in-${ci}`}>
            {particlePositions(ch.arc, ch.inCount, frame, PERIOD, "in", ch.seed).map(
              (p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={4.2}
                  fill={FLOW_IN}
                  opacity={(0.6 + 0.4 * p.fade) * intro}
                />
              ),
            )}
          </g>
        ))}

        {/* フロー集約点 */}
        {focusCentroid && (
          <circle
            cx={focusCentroid[0]}
            cy={focusCentroid[1]}
            r={13 * pulse}
            fill="none"
            stroke={FOCUS_COLOR}
            strokeWidth={2.4}
            opacity={0.7 * intro}
          />
        )}
      </svg>

      {/* 近接県の名前ラベル */}
      {shapes
        .filter((s) => s.near)
        .map((s) => (
          <div
            key={`plbl-${s.code}`}
            style={{
              position: "absolute",
              left: s.centroid[0] - 60,
              top: s.centroid[1] - 12,
              width: 120,
              textAlign: "center",
              fontSize: 18,
              fontWeight: FONT.weight.bold,
              color: "#475569",
              textShadow:
                "0 0 4px rgba(233,237,242,0.95), 0 1px 3px rgba(233,237,242,0.9)",
              opacity: intro,
              pointerEvents: "none",
            }}
          >
            {s.name}
          </div>
        ))}

      {/* 焦点県の主要市区町村ラベル */}
      {municipalityLabels.map((m) => (
        <div
          key={`mlbl-${m.code}`}
          style={{
            position: "absolute",
            left: m.x - 40,
            top: m.y - 9,
            width: 80,
            textAlign: "center",
            fontSize: 13,
            fontWeight: FONT.weight.black,
            color: "#1E293B",
            textShadow:
              "0 0 4px rgba(255,255,255,0.95), 0 1px 3px rgba(255,255,255,0.95)",
            opacity: intro,
            pointerEvents: "none",
          }}
        >
          {m.name}
        </div>
      ))}

      {/* 遠方地方ラベル（地図の外＝左右の余白） */}
      {regionFlows.map((r) => (
        <div
          key={`region-${r.region}`}
          style={{
            position: "absolute",
            left: r.anchor[0] - 92,
            top: r.anchor[1] - 33,
            width: 184,
            textAlign: "center",
            opacity: intro,
          }}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: "rgba(20,30,48,0.92)",
              border: `1px solid ${colors.border}`,
              borderRadius: 9,
              padding: "6px 12px",
            }}
          >
            <div
              style={{ fontSize: 19, fontWeight: FONT.weight.bold, color: "#E2E8F0" }}
            >
              {r.region}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: FONT.weight.black,
                color: r.net >= 0 ? IN_COLOR : OUT_COLOR,
              }}
            >
              {signed(r.net)}
              <span style={{ fontSize: 13, color: colors.muted }}> 人</span>
            </div>
          </div>
        </div>
      ))}

      {/* タイトル帯 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 104,
          background:
            "linear-gradient(to bottom, rgba(15,23,42,1) 0%, rgba(15,23,42,0.98) 64%, rgba(15,23,42,0))",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "24px 44px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span
            style={{
              fontSize: 40,
              fontWeight: FONT.weight.black,
              color: colors.foreground,
            }}
          >
            {data.focusName}
            <span style={{ color: FOCUS_COLOR }}> ⇄ </span>
            全国 人口移動フロー
          </span>
          <span
            style={{ fontSize: 22, fontWeight: FONT.weight.bold, color: colors.muted }}
          >
            {data.year}年
          </span>
        </div>
        <div style={{ display: "flex", gap: 22, alignItems: "baseline" }}>
          <Stat label="転入" value={fmt(data.totals.inflow * countT)} color={IN_COLOR} muted={colors.muted} />
          <Stat label="転出" value={fmt(data.totals.outflow * countT)} color={OUT_COLOR} muted={colors.muted} />
          <Stat
            label="純移動"
            value={signed(data.totals.net * countT)}
            color={data.totals.net >= 0 ? IN_COLOR : OUT_COLOR}
            muted={colors.muted}
          />
        </div>
      </div>

      {/* Top5 転入元（地図 左下） */}
      <RankPanel
        title="主な転入元"
        accent={IN_COLOR}
        rows={topInflow.map((p) => ({ name: p.name, value: p.inflow }))}
        style={{ left: MAP_RECT.x0 + 16, bottom: HEIGHT - MAP_RECT.y1 + 16 }}
        colors={colors}
        intro={intro}
      />
      {/* Top5 転出先（地図 右下） */}
      <RankPanel
        title="主な転出先"
        accent={OUT_COLOR}
        rows={topOutflow.map((p) => ({ name: p.name, value: p.outflow }))}
        style={{ right: WIDTH - MAP_RECT.x1 + 16, bottom: HEIGHT - MAP_RECT.y1 + 16 }}
        colors={colors}
        intro={intro}
      />

      {/* 凡例 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: 22,
          display: "flex",
          gap: 22,
          backgroundColor: "rgba(15,23,42,0.85)",
          borderRadius: 9,
          padding: "7px 18px",
          opacity: intro,
        }}
      >
        <Legend color={FLOW_IN} label="転入の流れ" />
        <Legend color={FLOW_OUT} label="転出の流れ" />
        <Legend color={FOCUS_COLOR} label={`${data.focusName}（市区町村別）`} />
      </div>

      {/* 出典 */}
      <div
        style={{
          position: "absolute",
          left: 44,
          bottom: 22,
          fontSize: 16,
          color: colors.muted,
          opacity: intro,
        }}
      >
        出典: 総務省統計局「住民基本台帳人口移動報告」{data.year}年 (e-Stat)
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------

const Stat: React.FC<{
  label: string;
  value: string;
  color: string;
  muted: string;
}> = ({ label, value, color, muted }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
    <span style={{ fontSize: 17, color: muted }}>{label}</span>
    <span style={{ fontSize: 30, fontWeight: FONT.weight.black, color }}>
      {value}
    </span>
    <span style={{ fontSize: 15, color: muted }}>人</span>
  </div>
);

const RankPanel: React.FC<{
  title: string;
  accent: string;
  rows: Array<{ name: string; value: number }>;
  style: React.CSSProperties;
  colors: (typeof COLOR_SCHEMES)[ThemeName];
  intro: number;
}> = ({ title, accent, rows, style, colors, intro }) => (
  <div
    style={{
      position: "absolute",
      width: 268,
      backgroundColor: "rgba(13,22,38,0.9)",
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: "12px 16px",
      opacity: intro,
      ...style,
    }}
  >
    <div
      style={{
        fontSize: 18,
        fontWeight: FONT.weight.black,
        color: accent,
        marginBottom: 8,
      }}
    >
      {title}
    </div>
    {rows.map((r, i) => (
      <div
        key={r.name}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px 0",
          borderBottom:
            i < rows.length - 1 ? `1px solid ${colors.border}` : "none",
        }}
      >
        <span
          style={{
            fontSize: 19,
            fontWeight: FONT.weight.bold,
            color: colors.foreground,
          }}
        >
          <span style={{ color: accent, marginRight: 8 }}>{i + 1}</span>
          {r.name}
        </span>
        <span style={{ fontSize: 19, fontWeight: FONT.weight.black, color: accent }}>
          {Math.round(r.value).toLocaleString("ja-JP")}
          <span style={{ fontSize: 13, color: colors.muted, marginLeft: 2 }}>
            人
          </span>
        </span>
      </div>
    ))}
  </div>
);

const Legend: React.FC<{ color: string; label: string }> = ({
  color,
  label,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
    <span
      style={{
        width: 13,
        height: 13,
        borderRadius: 7,
        backgroundColor: color,
        display: "inline-block",
      }}
    />
    <span style={{ fontSize: 16, color: "#CBD5E1" }}>{label}</span>
  </div>
);

interface LabelPos {
  code: string;
  name: string;
  x: number;
  y: number;
}

/** ラベル同士の重なりを反復で押し広げる */
function deOverlapLabels(items: LabelPos[]): LabelPos[] {
  const W = 86;
  const H = 24;
  const pos = items.map((it) => ({ ...it }));
  for (let iter = 0; iter < 26; iter++) {
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);
        if (adx < W && ady < H) {
          const ox = W - adx;
          const oy = H - ady;
          if (ox < oy) {
            const push = (ox / 2 + 0.5) * (dx < 0 ? -1 : 1);
            pos[i].x -= push;
            pos[j].x += push;
          } else {
            const push = (oy / 2 + 0.5) * (dy < 0 ? -1 : 1);
            pos[i].y -= push;
            pos[j].y += push;
          }
        }
      }
    }
  }
  return pos;
}
