import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import React, { useMemo } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

import type { Station, StationPassengerData } from "./types";

/** 24 秒 @ 30fps。Remotion 側の durationInFrames に使う */
export const STATION_PASSENGERS_DURATION = 720;

/** 出力フォーマット */
export type StationPassengersFormat = "landscape" | "portrait" | "square";

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface LayoutConfig {
  width: number;
  height: number;
  /** 地図パネル矩形 */
  mapRect: Rect;
  /** side = 地図の右に縦パネル / stacked = ヘッダー上・地図中央・フッター下の 3 段 */
  mode: "side" | "stacked";
  /** side モード: 統計パネル矩形 */
  panel?: Rect;
  /** stacked モード: 上部ヘッダー矩形（県名 + 年度） */
  header?: Rect;
  /** stacked モード: 下部フッター矩形（ランキング + 凡例 + 出典） */
  footer?: Rect;
  /** バブル最大半径 */
  rMax: number;
}

/** フォーマット別レイアウト */
const LAYOUTS: Record<StationPassengersFormat, LayoutConfig> = {
  // YouTube・X 用 16:9 — 左に地図、右に縦パネル
  landscape: {
    width: 1920,
    height: 1080,
    mapRect: { x0: 56, y0: 64, x1: 1336, y1: 1016 },
    panel: { x0: 1372, y0: 0, x1: 1884, y1: 1080 },
    mode: "side",
    rMax: 52,
  },
  // Instagram Reels・YouTube Shorts・TikTok 用 9:16 — 県名上・地図中央・ランキング下
  portrait: {
    width: 1080,
    height: 1920,
    header: { x0: 24, y0: 24, x1: 1056, y1: 300 },
    mapRect: { x0: 24, y0: 320, x1: 1056, y1: 1250 },
    footer: { x0: 24, y0: 1272, x1: 1056, y1: 1896 },
    mode: "stacked",
    rMax: 54,
  },
  // Instagram フィード用 1:1 — 県名上・地図中央・ランキング下
  square: {
    width: 1080,
    height: 1080,
    header: { x0: 24, y0: 18, x1: 1056, y1: 208 },
    mapRect: { x0: 24, y0: 222, x1: 1056, y1: 700 },
    footer: { x0: 24, y0: 712, x1: 1056, y1: 1062 },
    mode: "stacked",
    rMax: 38,
  },
};

/** アニメーション区間 (フレーム) */
const INTRO = 30;
const OUTRO = 40;

const R_MIN = 3;

const BUBBLE = "#0D9488"; // 乗降客数バブル (青緑)
const BUBBLE_DARK = "#0F766E";
const OUTLINE = "#D97706"; // 県境 (琥珀)
const RAIL = "#94A3B8"; // 在来線など (スレートグレー)
const SHINKANSEN = "#2563EB"; // 新幹線 (ロイヤルブルー)
const MAP_BG = "#EAEEF3";
const FG = "#1E293B";
const MUTED = "#64748B";
const FONT =
  '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", system-ui, sans-serif';

const fmt = (n: number) => Math.round(n).toLocaleString("ja-JP");

function interp(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  easing?: (t: number) => number,
): number {
  let t = (v - inMin) / (inMax - inMin || 1);
  t = Math.max(0, Math.min(1, t));
  if (easing) t = easing(t);
  return outMin + (outMax - outMin) * t;
}
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const AbsoluteFill: React.FC<{
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ style, children }) => (
  <div
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...style }}
  >
    {children}
  </div>
);

export interface StationPassengersReelProps {
  /** アニメーションフレーム。Remotion は useCurrentFrame() を渡す */
  frame: number;
  /** prefecture.topojson */
  topology: Topology;
  /** public/station-passengers/{NN}.json */
  data: StationPassengerData;
  /** N02 路線ライン (GeoJSON FeatureCollection)。省略時は路線図を描かない */
  railLines?: FeatureCollection | null;
  /** 出力フォーマット (既定: landscape 16:9) */
  format?: StationPassengersFormat;
}

interface PlacedStation extends Station {
  /** 投影後座標 */
  x: number;
  y: number;
}

export const StationPassengersReel: React.FC<StationPassengersReelProps> = ({
  frame,
  topology,
  data,
  railLines,
  format = "landscape",
}) => {
  const L = LAYOUTS[format];
  const { years } = data;

  /** 県境ポリゴン + 駅ポイント + 路線ラインの投影 */
  const placed = useMemo(() => {
    const { mapRect } = L;
    const objName = Object.keys(topology.objects)[0];
    const geo = feature(
      topology,
      topology.objects[objName] as GeometryCollection,
    ) as FeatureCollection;
    const prefFeat = geo.features.find(
      (f) => f.properties?.N03_007 === data.prefCode,
    );

    const cx = (mapRect.x0 + mapRect.x1) / 2;
    const cy = (mapRect.y0 + mapRect.y1) / 2;
    const fitW = (mapRect.x1 - mapRect.x0) * 0.96;
    const fitH = (mapRect.y1 - mapRect.y0) * 0.96;

    const projection = geoMercator();
    if (prefFeat) {
      projection.fitExtent(
        [
          [cx - fitW / 2, cy - fitH / 2],
          [cx + fitW / 2, cy + fitH / 2],
        ],
        prefFeat,
      );
    }
    const pathGen = geoPath(projection);
    const outline = prefFeat ? (pathGen(prefFeat) ?? "") : "";

    const stations: PlacedStation[] = data.stations.map((s) => {
      const p = projection([s.lon, s.lat]) ?? [cx, cy];
      return { ...s, x: p[0], y: p[1] };
    });

    /** 路線ラインを投影。新幹線 (lineName に「新幹線」) は別レイヤーに分ける */
    const railRegular: string[] = [];
    const railShinkansen: string[] = [];
    for (const f of railLines?.features ?? []) {
      const d = pathGen({
        type: "Feature",
        properties: {},
        geometry: f.geometry as Geometry,
      });
      if (!d) continue;
      const lineName = String(f.properties?.lineName ?? "");
      if (lineName.includes("新幹線")) railShinkansen.push(d);
      else railRegular.push(d);
    }

    return { outline, stations, railRegular, railShinkansen };
  }, [topology, data, railLines, L]);

  /** 全期間・全駅の最大乗降客数 (バブルスケールの分母) */
  const maxCount = useMemo(() => {
    let m = 1;
    for (const s of data.stations) {
      for (const v of Object.values(s.counts)) if (v > m) m = v;
    }
    return m;
  }, [data]);

  /** frame → 連続した年インデックス (0 .. years.length-1) */
  const yearFloat = interp(
    frame,
    INTRO,
    STATION_PASSENGERS_DURATION - OUTRO,
    0,
    Math.max(0, years.length - 1),
    easeInOut,
  );
  const yi = Math.min(years.length - 1, Math.floor(yearFloat));
  const yt = yearFloat - yi;
  const yearA = years[yi];
  const yearB = years[Math.min(years.length - 1, yi + 1)];
  /** 表示用の年 (整数に丸め) */
  const displayYear = Math.round(yearA + (yearB - yearA) * yt);

  /** 各駅の現在カウント (年間を補間) */
  const current = useMemo(() => {
    const out = new Map<string, number>();
    for (const s of placed.stations) {
      const a = s.counts[String(yearA)] ?? 0;
      const b = s.counts[String(yearB)] ?? 0;
      out.set(s.code, a + (b - a) * yt);
    }
    return out;
  }, [placed.stations, yearA, yearB, yt]);

  const radiusOf = (count: number): number =>
    count <= 0 ? 0 : R_MIN + (L.rMax - R_MIN) * Math.sqrt(count / maxCount);

  const intro = interp(frame, 0, INTRO, 0, 1, easeOutCubic);
  const outro = interp(
    frame,
    STATION_PASSENGERS_DURATION - OUTRO,
    STATION_PASSENGERS_DURATION,
    1,
    1,
  );
  const pulse = 1 + 0.04 * Math.sin(frame / 7);

  /** 描画順: 大きいバブルを下に */
  const drawOrder = useMemo(
    () =>
      [...placed.stations].sort(
        (a, b) => (current.get(b.code) ?? 0) - (current.get(a.code) ?? 0),
      ),
    [placed.stations, current],
  );

  /** 現在年の上位駅 */
  const ranked = useMemo(
    () =>
      [...placed.stations]
        .map((s) => ({ s, c: current.get(s.code) ?? 0 }))
        .filter((r) => r.c > 0)
        .sort((a, b) => b.c - a.c),
    [placed.stations, current],
  );
  const top5 = ranked.slice(0, 5);
  /** 地図上にラベルを出す上位駅 */
  const labelCodes = new Set(ranked.slice(0, 7).map((r) => r.s.code));

  const totalCount = ranked.reduce((sum, r) => sum + r.c, 0);
  const { mapRect } = L;

  return (
    <AbsoluteFill style={{ backgroundColor: "#F8FAFC", fontFamily: FONT }}>
      {/* ───────── 地図 ───────── */}
      <svg
        width={L.width}
        height={L.height}
        viewBox={`0 0 ${L.width} ${L.height}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {/* 地図パネル背景 */}
        <rect
          x={mapRect.x0}
          y={mapRect.y0}
          width={mapRect.x1 - mapRect.x0}
          height={mapRect.y1 - mapRect.y0}
          fill={MAP_BG}
          stroke="#94A3B8"
          strokeWidth={1.5}
          rx={12}
        />

        {/* 県境ポリゴンを路線ラインのクリップ領域に使う */}
        {placed.outline && (
          <defs>
            <clipPath id="pref-clip">
              <path d={placed.outline} />
            </clipPath>
          </defs>
        )}

        {/* 県境アウトライン */}
        {placed.outline && (
          <path
            d={placed.outline}
            fill="#FFFFFF"
            stroke={OUTLINE}
            strokeWidth={2.6}
            strokeLinejoin="round"
            opacity={intro}
          />
        )}

        {/* 路線図レイヤー (N02 鉄道路線、県境でクリップ) */}
        {(placed.railRegular.length > 0 ||
          placed.railShinkansen.length > 0) && (
          <g clipPath="url(#pref-clip)" opacity={intro}>
            {placed.railRegular.map((d, i) => (
              <path
                key={`rail-${i}`}
                d={d}
                fill="none"
                stroke={RAIL}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {placed.railShinkansen.map((d, i) => (
              <path
                key={`shin-${i}`}
                d={d}
                fill="none"
                stroke={SHINKANSEN}
                strokeWidth={3.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        )}

        {/* 駅バブル */}
        {drawOrder.map((s) => {
          const r = radiusOf(current.get(s.code) ?? 0) * intro * outro * pulse;
          if (r < 0.5) return null;
          return (
            <circle
              key={s.code}
              cx={s.x}
              cy={s.y}
              r={r}
              fill={BUBBLE}
              fillOpacity={0.5}
              stroke={BUBBLE_DARK}
              strokeWidth={1.2}
              strokeOpacity={0.85}
            />
          );
        })}

        {/* 上位駅ラベル */}
        {drawOrder
          .filter((s) => labelCodes.has(s.code))
          .map((s) => {
            const c = current.get(s.code) ?? 0;
            const r = radiusOf(c) * intro * outro;
            return (
              <g key={`lbl-${s.code}`} opacity={intro}>
                <text
                  x={s.x}
                  y={s.y - r - 8}
                  textAnchor="middle"
                  fontSize={22}
                  fontWeight={800}
                  fill={FG}
                  stroke="#FFFFFF"
                  strokeWidth={4}
                  paintOrder="stroke"
                >
                  {s.name}
                </text>
                <text
                  x={s.x}
                  y={s.y - r + 14}
                  textAnchor="middle"
                  fontSize={19}
                  fontWeight={800}
                  fill={BUBBLE_DARK}
                  stroke="#FFFFFF"
                  strokeWidth={4}
                  paintOrder="stroke"
                >
                  {fmt(c)}
                </text>
              </g>
            );
          })}
      </svg>

      {/* ───────── 統計パネル ───────── */}
      {/* side: 地図の右に縦パネル (16:9) */}
      {L.mode === "side" && L.panel && (
        <div
          style={{
            position: "absolute",
            left: L.panel.x0,
            top: L.panel.y0,
            width: L.panel.x1 - L.panel.x0,
            height: L.panel.y1 - L.panel.y0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
            opacity: intro,
          }}
        >
          <TitleBlock prefName={data.prefName} />
          <YearBlock
            displayYear={displayYear}
            stationCount={ranked.length}
            totalCount={totalCount}
          />
          <RankingBlock rows={top5} />
          <LegendBlock />
          <SourceBlock source={data.source} dataset={data.dataset} />
        </div>
      )}

      {/* stacked: ヘッダー (県名 + 年度) を地図の上に (9:16 / 1:1) */}
      {L.mode === "stacked" && L.header && (
        <div
          style={{
            position: "absolute",
            left: L.header.x0,
            top: L.header.y0,
            width: L.header.x1 - L.header.x0,
            height: L.header.y1 - L.header.y0,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 20,
            opacity: intro,
          }}
        >
          <div style={{ flex: "1 1 0" }}>
            <TitleBlock prefName={data.prefName} />
          </div>
          <div style={{ flex: "1 1 0" }}>
            <YearBlock
              displayYear={displayYear}
              stationCount={ranked.length}
              totalCount={totalCount}
            />
          </div>
        </div>
      )}

      {/* stacked: フッター (ランキング + 凡例 + 出典) を地図の下に */}
      {L.mode === "stacked" && L.footer && (
        <div
          style={{
            position: "absolute",
            left: L.footer.x0,
            top: L.footer.y0,
            width: L.footer.x1 - L.footer.x0,
            height: L.footer.y1 - L.footer.y0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 12,
            opacity: intro,
          }}
        >
          <RankingBlock rows={top5} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 16,
            }}
          >
            <LegendBlock />
            <SourceBlock source={data.source} dataset={data.dataset} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// パネル構成ブロック (side / below 両モードで共用)

const TitleBlock: React.FC<{ prefName: string }> = ({ prefName }) => (
  <div>
    <div style={{ fontSize: 44, fontWeight: 900, color: FG, lineHeight: 1.15 }}>
      {prefName}
    </div>
    <div style={{ fontSize: 23, fontWeight: 700, color: MUTED }}>
      鉄道駅の乗降客数
    </div>
  </div>
);

const YearBlock: React.FC<{
  displayYear: number;
  stationCount: number;
  totalCount: number;
}> = ({ displayYear, stationCount, totalCount }) => (
  <div
    style={{
      backgroundColor: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: 14,
      padding: "16px 22px",
    }}
  >
    <div style={{ fontSize: 18, color: MUTED, fontWeight: 700 }}>年度</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
      <span
        style={{ fontSize: 76, fontWeight: 900, color: OUTLINE, lineHeight: 1 }}
      >
        {displayYear}
      </span>
      <span style={{ fontSize: 24, color: MUTED, fontWeight: 700 }}>年度</span>
    </div>
    <div style={{ marginTop: 6, fontSize: 19, color: MUTED }}>
      県内 {stationCount} 駅 合計{" "}
      <span style={{ fontSize: 26, fontWeight: 900, color: BUBBLE_DARK }}>
        {fmt(totalCount)}
      </span>{" "}
      人/日
    </div>
  </div>
);

const RankingBlock: React.FC<{
  rows: Array<{ s: { code: string; name: string }; c: number }>;
}> = ({ rows }) => (
  <div
    style={{
      backgroundColor: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: 14,
      padding: "14px 22px",
      height: "100%",
    }}
  >
    <div
      style={{
        fontSize: 20,
        fontWeight: 900,
        color: BUBBLE_DARK,
        marginBottom: 8,
      }}
    >
      乗降客数ランキング
    </div>
    {rows.map((r, i) => (
      <div
        key={r.s.code}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 0",
          borderBottom:
            i < rows.length - 1 ? "1px solid rgba(148,163,184,0.2)" : "none",
        }}
      >
        <span style={{ fontSize: 23, fontWeight: 700, color: FG }}>
          <span style={{ color: OUTLINE, fontWeight: 900, marginRight: 12 }}>
            {i + 1}
          </span>
          {r.s.name}
        </span>
        <span style={{ fontSize: 24, fontWeight: 900, color: BUBBLE_DARK }}>
          {fmt(r.c)}
          <span style={{ fontSize: 14, color: MUTED, marginLeft: 3 }}>
            人/日
          </span>
        </span>
      </div>
    ))}
  </div>
);

const LegendBlock: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={56} height={24}>
        <circle cx={12} cy={12} r={6} fill={BUBBLE} fillOpacity={0.5} stroke={BUBBLE_DARK} />
        <circle cx={40} cy={12} r={11} fill={BUBBLE} fillOpacity={0.5} stroke={BUBBLE_DARK} />
      </svg>
      <span style={{ fontSize: 16, color: MUTED }}>
        円の大きさ = 1 日あたり乗降客数
      </span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={56} height={20}>
        <line x1={6} y1={6} x2={50} y2={6} stroke={SHINKANSEN} strokeWidth={3.6} />
        <line x1={6} y1={15} x2={50} y2={15} stroke={RAIL} strokeWidth={2.4} />
      </svg>
      <span style={{ fontSize: 16, color: MUTED }}>
        <span style={{ color: SHINKANSEN, fontWeight: 700 }}>新幹線</span>
        {" / "}在来線 (国土数値情報 N02)
      </span>
    </div>
  </div>
);

const SourceBlock: React.FC<{ source: string; dataset: string }> = ({
  source,
  dataset,
}) => (
  <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.5, textAlign: "right" }}>
    出典: {source}
    <br />
    {dataset}
  </div>
);
