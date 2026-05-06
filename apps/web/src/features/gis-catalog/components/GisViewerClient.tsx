"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useCallback, useEffect } from "react";
import type { GisDatasetRow, KsjMeta, KsjMetaFile } from "../types";
import { useKsjData } from "../hooks/useKsjData";
import type { FeatureCollection, Geometry } from "geojson";
import type { KsjGeometryType, KsjLayer } from "@stats47/visualization/leaflet";

// SSR を避けるため dynamic import
const KsjLeafletMap = dynamic(
  () => import("@stats47/visualization/leaflet").then((m) => m.KsjLeafletMap),
  { ssr: false, loading: () => <MapPlaceholder text="地図を読み込み中…" /> }
);


const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB

const LAYER_COLORS = [
  "#e11d48", "#2563eb", "#16a34a", "#d97706", "#7c3aed",
  "#0891b2", "#ea580c", "#4f46e5", "#be185d", "#0f766e",
];

const EN_TO_JA: Record<string, string> = {
  Airport: "空港",
  AirportReferencePoint: "空港基準点",
  BiomassPowerStation: "バイオマス発電所",
  FireStation: "消防署",
  FireStationJurisdiction: "消防署管轄区域",
  FishingPort: "漁港",
  FishingPortBoundary: "漁港区域",
  GeneralHydroelectricPowerPlant: "一般水力発電所",
  GeothermalPowerPlant: "地熱発電所",
  HarborDistrictBoundary: "港湾区域",
  HighwaySection: "高速道路区間",
  Joint: "接続点",
  NuclearPowerPlant: "原子力発電所",
  PhotovoltaicPowerPlant: "太陽光発電所",
  PoliceStation: "警察署",
  PoliceStationJurisdiction: "警察署管轄区域",
  PondInformation: "ため池",
  PortAndHarbor: "港湾",
  PortDistrictBoundary: "港湾地区境界",
  PowerPlantComplex: "発電所複合施設",
  PumpedStorageHydroelectricPlant: "揚水式水力発電所",
  RailroadSection: "鉄道区間",
  RiverNode: "河川ノード",
  Station: "駅",
  Stream: "河川",
  SurveyContent: "調査内容",
  TerminalBuilding: "ターミナルビル",
  ThermalPowerPlant: "火力発電所",
  WindPowerPlant: "風力発電所",
};

function filenameToLabel(filename: string): string {
  const base = filename.replace(/\.topojson$/, "");
  if (!base.includes("_")) return base === "national" ? "全国" : base;
  const enPart = base.split("_").slice(1).join("_");
  return EN_TO_JA[enPart] ?? enPart;
}

interface LoadedLayer {
  geojson: FeatureCollection<Geometry>;
  color: string;
  visible: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${bytes}B`;
}

function MapPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-full bg-slate-50 text-muted-foreground text-sm rounded-md border">
      {text}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 都道府県 1 件ずつを非表示でロードするサブコンポーネント
// ──────────────────────────────────────────────────────────────

const PREF_CODES = Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, "0"));

function PrefLoader({
  r2Prefix,
  prefCode,
  onLoad,
}: {
  r2Prefix: string;
  prefCode: string;
  onLoad: (code: string, geojson: FeatureCollection<Geometry>) => void;
}) {
  const { geojson } = useKsjData(r2Prefix, `${prefCode}.topojson`);
  useEffect(() => {
    if (geojson) onLoad(prefCode, geojson);
  }, [geojson, prefCode, onLoad]);
  return null;
}

// ──────────────────────────────────────────────────────────────
// 全国一括表示（47 都道府県を並列ロードして 1 枚に統合）
// ──────────────────────────────────────────────────────────────

function AllPrefecturesViewer({
  dataset,
  geometryType,
}: {
  dataset: GisDatasetRow;
  geometryType: KsjGeometryType;
}) {
  const [loaded, setLoaded] = useState<Map<string, FeatureCollection<Geometry>>>(new Map());

  const handleLoad = useCallback((code: string, geojson: FeatureCollection<Geometry>) => {
    setLoaded((prev) => new Map(prev).set(code, geojson));
  }, []);

  const mergedLayer = useMemo<KsjLayer | null>(() => {
    if (loaded.size === 0) return null;
    const features = Array.from(loaded.values()).flatMap((g) => g.features);
    return {
      geojson: { type: "FeatureCollection", features } as FeatureCollection<Geometry>,
      label: "全国",
    };
  }, [loaded]);

  return (
    <div className="flex flex-col gap-3">
      {/* 非表示ローダー群 */}
      {dataset.r2Prefix && PREF_CODES.map((code) => (
        <PrefLoader key={code} r2Prefix={dataset.r2Prefix!} prefCode={code} onLoad={handleLoad} />
      ))}

      <p className="text-xs text-slate-500">
        {loaded.size} / 47 都道府県読み込み完了
        {loaded.size === 47 && (
          <span className="ml-2 text-emerald-600">
            ✓ {mergedLayer?.geojson.features.length.toLocaleString()} 件
          </span>
        )}
      </p>

      <div className="h-[560px]">
        {mergedLayer ? (
          <KsjLeafletMap layers={[mergedLayer]} geometryType={geometryType} className="h-full w-full rounded-md border" />
        ) : (
          <MapPlaceholder text="読み込み中…" />
        )}
      </div>
    </div>
  );
}


// ──────────────────────────────────────────────────────────────
// メイン: GisViewerClient
// ──────────────────────────────────────────────────────────────

interface GisViewerClientProps {
  dataset: GisDatasetRow;
  meta: KsjMeta | null;
}

export function GisViewerClient({ dataset, meta }: GisViewerClientProps) {
  const geometryType = dataset.geometryType as KsjGeometryType;
  const isPrefecture = dataset.coverage === "prefecture" || dataset.coverage === "mesh";

  if (!meta) {
    return (
      <div className="text-sm text-red-500 p-4">
        メタデータを取得できませんでした（R2 未アップロードの可能性があります）
      </div>
    );
  }

  if (isPrefecture) {
    return <AllPrefecturesViewer dataset={dataset} geometryType={geometryType} />;
  }

  return <NationalViewer dataset={dataset} meta={meta} geometryType={geometryType} />;
}

// ──────────────────────────────────────────────────────────────
// 全国データセット ビューア（全ファイルを単一マップに重畳）
// ──────────────────────────────────────────────────────────────

function NationalViewer({
  dataset,
  meta,
  geometryType,
}: {
  dataset: GisDatasetRow;
  meta: KsjMeta;
  geometryType: KsjGeometryType;
}) {
  // ファイル順にカラーを事前割り当て
  const fileColors = useMemo(
    () => new Map(meta.files.map((f, i) => [f.filename, LAYER_COLORS[i % LAYER_COLORS.length]])),
    [meta.files]
  );

  const [layerMap, setLayerMap] = useState<Map<string, LoadedLayer>>(new Map());

  const handleLoad = useCallback(
    (filename: string, geojson: FeatureCollection<Geometry>) => {
      setLayerMap((prev) => {
        if (prev.has(filename)) return prev;
        const color = fileColors.get(filename) ?? LAYER_COLORS[0];
        return new Map(prev).set(filename, { geojson, color, visible: true });
      });
    },
    [fileColors]
  );

  const toggleVisible = useCallback((filename: string) => {
    setLayerMap((prev) => {
      const entry = prev.get(filename);
      if (!entry) return prev;
      return new Map(prev).set(filename, { ...entry, visible: !entry.visible });
    });
  }, []);

  const visibleLayers = useMemo<KsjLayer[]>(
    () =>
      meta.files
        .filter((f) => layerMap.get(f.filename)?.visible)
        .map((f) => {
          const l = layerMap.get(f.filename)!;
          return { geojson: l.geojson, label: filenameToLabel(f.filename), color: l.color };
        }),
    [meta.files, layerMap]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* レイヤー一覧（凡例 + チェックボックス） */}
      <div className="space-y-1 border rounded-md p-3 bg-slate-50">
        {meta.files.map((file) => (
          <NationalFileRow
            key={file.filename}
            r2Prefix={dataset.r2Prefix!}
            file={file}
            color={fileColors.get(file.filename)!}
            loadedLayer={layerMap.get(file.filename)}
            onLoad={handleLoad}
            onToggle={toggleVisible}
          />
        ))}
      </div>

      {/* 単一マップ */}
      <div className="h-[520px]">
        {layerMap.size > 0 ? (
          <KsjLeafletMap
            layers={visibleLayers}
            geometryType={geometryType}
            className="h-full w-full rounded-md border"
          />
        ) : (
          <MapPlaceholder text="読み込み中…" />
        )}
      </div>
    </div>
  );
}

// ファイル 1 行：色丸 + チェックボックス + ラベル + ロード状態
function NationalFileRow({
  r2Prefix,
  file,
  color,
  loadedLayer,
  onLoad,
  onToggle,
}: {
  r2Prefix: string;
  file: KsjMetaFile;
  color: string;
  loadedLayer: LoadedLayer | undefined;
  onLoad: (filename: string, geojson: FeatureCollection<Geometry>) => void;
  onToggle: (filename: string) => void;
}) {
  const isLarge = file.sizeBytes > LARGE_FILE_THRESHOLD;
  const [shouldLoad, setShouldLoad] = useState(!isLarge);
  const { geojson, loading, error } = useKsjData(
    shouldLoad ? r2Prefix : null,
    shouldLoad ? file.filename : null
  );

  useEffect(() => {
    if (geojson) onLoad(file.filename, geojson);
  }, [geojson, file.filename, onLoad]);

  const label = filenameToLabel(file.filename);

  return (
    <div className="flex items-center gap-2 text-sm min-w-0">
      {/* チェックボックス（ロード済みのみ有効） */}
      <input
        type="checkbox"
        checked={loadedLayer?.visible ?? false}
        disabled={!loadedLayer}
        onChange={() => onToggle(file.filename)}
        className="shrink-0 cursor-pointer disabled:cursor-default"
        style={{ accentColor: color }}
      />
      {/* 色丸 */}
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: loadedLayer ? color : "#e2e8f0" }}
      />
      {/* ラベル */}
      <span className={`min-w-0 truncate ${loadedLayer && !loadedLayer.visible ? "text-slate-400" : "text-slate-700"}`}>
        {label}
      </span>
      {/* メタ情報 */}
      <span className="text-xs text-slate-400 shrink-0 ml-auto">{formatBytes(file.sizeBytes)}</span>
      <span className="text-xs text-slate-400 shrink-0">{file.featureCount.toLocaleString()} 件</span>
      {/* ロード状態 */}
      {loading && <span className="text-xs text-muted-foreground shrink-0">読み込み中…</span>}
      {error && <span className="text-xs text-red-500 shrink-0 max-w-[140px] truncate" title={error}>{error}</span>}
      {isLarge && !shouldLoad && (
        <button onClick={() => setShouldLoad(true)} className="text-xs text-blue-600 underline shrink-0">
          ロード
        </button>
      )}
    </div>
  );
}
