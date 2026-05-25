import React, { useMemo } from "react";
import type { Topology } from "topojson-specification";

import { buildMigrationMap } from "./lib/build-map";
import type { ThemeName } from "./theme";
import type { MigrationFlowData, MunicipalityData } from "./types";

/** IG Reels サムネ用 portrait 静止画 (1080x1920) */
export const COVER_WIDTH = 1080;
export const COVER_HEIGHT = 1920;

const MAP_RECT = { x0: 30, y0: 380, x1: 1050, y1: 1480 };

const FG = "#0F172A";
const MUTED = "#475569";
const ACCENT_IN = "#0D9488"; // 転入超過 (青緑)
const ACCENT_OUT = "#DC2626"; // 転出超過 (赤)
const OUTLINE = "#D97706"; // 県境 (琥珀)
const MAP_BG = "#EAEEF3";
const COAST = "#CBD5E1";
const FONT =
  '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", system-ui, sans-serif';

const fmt = (n: number) => n.toLocaleString("ja-JP");

interface MigrationFlowCoverProps {
  topology: Topology;
  data: MigrationFlowData;
  cityTopology?: Topology | null;
  municipalities?: MunicipalityData | null;
  theme?: ThemeName;
}

export const MigrationFlowCover: React.FC<MigrationFlowCoverProps> = ({
  topology,
  data,
  cityTopology,
  municipalities,
}) => {
  const map = useMemo(
    () =>
      buildMigrationMap(topology, data, {
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
        mapRect: MAP_RECT,
        cityTopology: cityTopology ?? undefined,
        municipalities: municipalities?.municipalities,
      }),
    [topology, data, cityTopology, municipalities],
  );

  const { shapes, municipalityShapes, focusOutlinePath } = map;
  const net = data.totals.net;
  const isInflow = net > 0;
  const top3Inflow = [...data.partners]
    .filter((p) => p.inflow - p.outflow > 0)
    .sort((a, b) => b.inflow - a.inflow)
    .slice(0, 3);
  const top3Outflow = [...data.partners]
    .filter((p) => p.outflow - p.inflow > 0)
    .sort((a, b) => b.outflow - a.outflow)
    .slice(0, 3);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
        backgroundColor: "#FFFFFF",
        fontFamily: FONT,
      }}
    >
      {/* ===== ヘッダー (大県名 + サブ) ===== */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 40,
          width: "100%",
          textAlign: "center",
          padding: "0 40px",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 124,
            fontWeight: 900,
            color: FG,
            lineHeight: 1.05,
            letterSpacing: 2,
          }}
        >
          {data.focusName}
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: MUTED,
            marginTop: 16,
            letterSpacing: 2,
          }}
        >
          ⇄ 全国 人口移動 {data.year}年
        </div>
      </div>

      {/* ===== 地図 ===== */}
      <svg
        width={COVER_WIDTH}
        height={COVER_HEIGHT}
        viewBox={`0 0 ${COVER_WIDTH} ${COVER_HEIGHT}`}
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
      >
        <rect
          x={MAP_RECT.x0}
          y={MAP_RECT.y0}
          width={MAP_RECT.x1 - MAP_RECT.x0}
          height={MAP_RECT.y1 - MAP_RECT.y0}
          fill={MAP_BG}
          rx={20}
        />
        {/* 全国の県境 (グレー一色) */}
        {shapes.map((s) => (
          <path
            key={`pref-${s.code}`}
            d={s.path}
            fill="#F8FAFC"
            stroke={COAST}
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        ))}
        {/* 市区町村コロプレス (焦点県) */}
        {municipalityShapes.map((m) => (
          <path
            key={`muni-${m.code}`}
            d={m.path}
            fill={m.fill}
            stroke="#FFFFFF"
            strokeWidth={0.4}
          />
        ))}
        {/* 焦点県アウトライン (上に重ねる) */}
        {focusOutlinePath && (
          <path
            d={focusOutlinePath}
            fill="none"
            stroke={OUTLINE}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* ===== フッター (純移動数値 + TOP3) ===== */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 30,
          width: "100%",
          padding: "0 40px",
          zIndex: 10,
        }}
      >
        {/* 純移動の大きい数字 */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 28, color: MUTED, fontWeight: 700 }}>
            純移動
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: isInflow ? ACCENT_IN : ACCENT_OUT,
              lineHeight: 1.05,
              letterSpacing: 2,
            }}
          >
            {isInflow ? "+" : "−"}
            {fmt(Math.abs(net))}
            <span style={{ fontSize: 38, marginLeft: 8 }}>人</span>
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: isInflow ? ACCENT_IN : ACCENT_OUT,
            }}
          >
            {isInflow ? "転入超過" : "転出超過"}
          </div>
        </div>

        {/* TOP 3 */}
        <div style={{ display: "flex", gap: 14 }}>
          <div
            style={{
              flex: "1 1 0",
              backgroundColor: "#ECFDF5",
              borderRadius: 14,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: ACCENT_IN }}>
              主な転入元
            </div>
            {top3Inflow.map((p, i) => (
              <div
                key={`in-${p.code}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginTop: 4,
                  fontSize: 22,
                }}
              >
                <span style={{ fontWeight: 700, color: FG }}>
                  {i + 1}. {p.name}
                </span>
                <span
                  style={{ fontWeight: 800, color: ACCENT_IN, fontSize: 20 }}
                >
                  {fmt(p.inflow)}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              flex: "1 1 0",
              backgroundColor: "#FEF2F2",
              borderRadius: 14,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: ACCENT_OUT }}>
              主な転出先
            </div>
            {top3Outflow.map((p, i) => (
              <div
                key={`out-${p.code}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginTop: 4,
                  fontSize: 22,
                }}
              >
                <span style={{ fontWeight: 700, color: FG }}>
                  {i + 1}. {p.name}
                </span>
                <span
                  style={{ fontWeight: 800, color: ACCENT_OUT, fontSize: 20 }}
                >
                  {fmt(p.outflow)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
