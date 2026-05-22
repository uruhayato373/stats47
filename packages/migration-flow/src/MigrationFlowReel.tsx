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

const FRAME_W = 1920;
const FRAME_H = 1080;

/** 左の「地図コンポーネント」幅。右は統計パネル。 */
const MAP_W = 1400;
/** 地図本体の矩形（MAP_W 内。外側の余白に地方ラベルを置く） */
const MAP_RECT: MapRect = { x0: 200, y0: 56, x1: 1200, y1: 1024 };
/** 右パネル */
const PANEL_X = 1436;
const PANEL_W = FRAME_W - PANEL_X - 36;

const MUNI_LABEL_COUNT = 12;
const MAX_PARTICLES = 14;
const PERIOD = 84;

const IN_COLOR = "#0D9488"; // 転入（濃い青緑）— 白背景でも視認可
const OUT_COLOR = "#DC2626"; // 転出（濃い赤）— 同上
const FOCUS_COLOR = "#D97706"; // 焦点県の輪郭（琥珀）
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
  /** パーティクル数（純移動の絶対値に比例） */
  count: number;
  /** 純移動の向き（in=焦点県へ流入超過 / out=焦点県から流出超過） */
  direction: "in" | "out";
  /** パーティクル・帯の色 */
  color: string;
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
  theme = "light",
}) => {
  const colors = COLOR_SCHEMES[theme];

  const map = useMemo(
    () =>
      buildMigrationMap(topology, data, {
        width: MAP_W,
        height: FRAME_H,
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

  // 純移動の絶対値スケール（近接県・地方とも共通）
  const maxNet = useMemo(() => {
    const nets: number[] = [];
    for (const s of shapes) {
      if (!s.near) continue;
      const p = partnerByCode.get(s.code);
      if (p) nets.push(Math.abs(p.inflow - p.outflow));
    }
    for (const r of regionFlows) nets.push(Math.abs(r.net));
    return Math.max(1, ...nets);
  }, [shapes, regionFlows, partnerByCode]);

  // 各チャンネルは「純移動の向き」だけを描く（流入超過=青で入る／流出超過=赤で出る）
  const nearChannels = useMemo<Channel[]>(() => {
    if (!focusCentroid) return [];
    const result: Channel[] = [];
    let idx = 0;
    for (const s of shapes) {
      if (!s.near) continue;
      const p = partnerByCode.get(s.code);
      if (!p) continue;
      const net = p.inflow - p.outflow;
      const inward = net >= 0;
      result.push({
        arc: buildArc(s.centroid, focusCentroid),
        count: Math.round(MAX_PARTICLES * Math.sqrt(Math.abs(net) / maxNet)),
        direction: inward ? "in" : "out",
        color: inward ? IN_COLOR : OUT_COLOR,
        width: 0.8 + 4 * Math.sqrt(Math.abs(net) / maxNet),
        seed: (idx++ % 7) / 7,
      });
    }
    return result;
  }, [shapes, focusCentroid, partnerByCode, maxNet]);

  const regionChannels = useMemo<Array<Channel & { region: RegionFlow }>>(() => {
    if (!focusCentroid) return [];
    return regionFlows.map((r, idx) => {
      const inward = r.net >= 0;
      return {
        region: r,
        arc: buildArc(r.anchor, focusCentroid, 0.05),
        count: Math.round(MAX_PARTICLES * Math.sqrt(Math.abs(r.net) / maxNet)),
        direction: inward ? ("in" as const) : ("out" as const),
        color: inward ? IN_COLOR : OUT_COLOR,
        width: 2 + 12 * Math.sqrt(Math.abs(r.net) / maxNet),
        seed: (idx % 5) / 5,
      };
    });
  }, [regionFlows, focusCentroid, maxNet]);

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
      {/* ───────── 左: 地図コンポーネント（地図 + 地方ラベル）───────── */}
      <svg
        width={MAP_W}
        height={FRAME_H}
        viewBox={`0 0 ${MAP_W} ${FRAME_H}`}
        style={{ position: "absolute", left: 0, top: 0 }}
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

        {/* フロー帯・アーク（純移動の向きの色。クリップせず余白のラベルまで届かせる） */}
        {regionChannels.map((ch) => (
          <path
            key={`rband-${ch.region.region}`}
            d={bezierPath(ch.arc)}
            fill="none"
            stroke={ch.color}
            strokeOpacity={0.18}
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
            stroke={ch.color}
            strokeOpacity={0.26}
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

        {/* パーティクル（チャンネルごとに純移動の向き・色で1方向だけ） */}
        {allChannels.map((ch, ci) => (
          <g key={`p-${ci}`}>
            {particlePositions(
              ch.arc,
              ch.count,
              frame,
              PERIOD,
              ch.direction,
              ch.seed,
            ).map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={4.2}
                fill={ch.color}
                opacity={(0.6 + 0.4 * p.fade) * intro}
              />
            ))}
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

      {/* 遠方地方ラベル（地図コンポーネント内の左右余白） */}
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
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 9,
              padding: "6px 12px",
              boxShadow: "0 2px 8px rgba(15,23,42,0.12)",
            }}
          >
            <div
              style={{
                fontSize: 19,
                fontWeight: FONT.weight.bold,
                color: colors.foreground,
              }}
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

      {/* ───────── 右: 統計パネル ───────── */}
      <div
        style={{
          position: "absolute",
          left: PANEL_X,
          top: 0,
          width: PANEL_W,
          height: FRAME_H,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 18,
          opacity: intro,
        }}
      >
        {/* タイトル */}
        <div>
          <div
            style={{
              fontSize: 38,
              fontWeight: FONT.weight.black,
              color: colors.foreground,
              lineHeight: 1.2,
            }}
          >
            {data.focusName}
            <span style={{ color: FOCUS_COLOR }}> ⇄ </span>全国
          </div>
          <div
            style={{ fontSize: 22, fontWeight: FONT.weight.bold, color: colors.muted }}
          >
            人口移動フロー {data.year}年
          </div>
        </div>

        {/* 集計 */}
        <div
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: "14px 18px",
          }}
        >
          <StatRow label="転入" value={fmt(data.totals.inflow * countT)} color={IN_COLOR} muted={colors.muted} />
          <StatRow label="転出" value={fmt(data.totals.outflow * countT)} color={OUT_COLOR} muted={colors.muted} />
          <StatRow
            label="純移動"
            value={signed(data.totals.net * countT)}
            color={data.totals.net >= 0 ? IN_COLOR : OUT_COLOR}
            muted={colors.muted}
            last
          />
        </div>

        {/* Top5 */}
        <RankList
          title="主な転入元"
          accent={IN_COLOR}
          rows={topInflow.map((p) => ({ name: p.name, value: p.inflow }))}
          colors={colors}
        />
        <RankList
          title="主な転出先"
          accent={OUT_COLOR}
          rows={topOutflow.map((p) => ({ name: p.name, value: p.outflow }))}
          colors={colors}
        />

        {/* 凡例 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
          <Legend color={IN_COLOR} label={`転入超過（${data.focusName}へ）`} />
          <Legend color={OUT_COLOR} label={`転出超過（${data.focusName}から）`} />
          <Legend color={FOCUS_COLOR} label={`${data.focusName}（市区町村別）`} />
        </div>

        {/* 出典 */}
        <div style={{ fontSize: 14, color: colors.muted }}>
          出典: 総務省統計局「住民基本台帳人口移動報告」{data.year}年 (e-Stat)
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------

const StatRow: React.FC<{
  label: string;
  value: string;
  color: string;
  muted: string;
  last?: boolean;
}> = ({ label, value, color, muted, last }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      padding: "7px 0",
      borderBottom: last ? "none" : `1px solid rgba(148,163,184,0.18)`,
    }}
  >
    <span style={{ fontSize: 19, color: muted }}>{label}</span>
    <span>
      <span style={{ fontSize: 32, fontWeight: FONT.weight.black, color }}>
        {value}
      </span>
      <span style={{ fontSize: 15, color: muted, marginLeft: 4 }}>人</span>
    </span>
  </div>
);

const RankList: React.FC<{
  title: string;
  accent: string;
  rows: Array<{ name: string; value: number }>;
  colors: (typeof COLOR_SCHEMES)[ThemeName];
}> = ({ title, accent, rows, colors }) => (
  <div
    style={{
      backgroundColor: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: "12px 18px",
    }}
  >
    <div
      style={{
        fontSize: 19,
        fontWeight: FONT.weight.black,
        color: accent,
        marginBottom: 6,
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
          padding: "5px 0",
          borderBottom:
            i < rows.length - 1
              ? `1px solid rgba(148,163,184,0.16)`
              : "none",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: FONT.weight.bold,
            color: colors.foreground,
          }}
        >
          <span style={{ color: accent, marginRight: 10 }}>{i + 1}</span>
          {r.name}
        </span>
        <span style={{ fontSize: 20, fontWeight: FONT.weight.black, color: accent }}>
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
    <span style={{ fontSize: 15, color: "#475569" }}>{label}</span>
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
