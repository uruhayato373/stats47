"use client";

import { useState, useEffect, useRef } from "react";
import * as topojsonClient from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";

/**
 * L3 キャッシュ: モジュールレベル Map（SPA ナビゲーション間で保持）
 *
 * キャッシュ戦略:
 *   L1 Cloudflare CDN — Cache-Control: public, max-age=31536000 (バージョン付きパスなので immutable)
 *   L2 ブラウザ HTTP キャッシュ — L1 に依存
 *   L3 このモジュールレベル Map — ページ遷移をまたいで保持（同一 SPA セッション内）
 */
const topoCache = new Map<string, FeatureCollection<Geometry>>();

function getR2BaseUrl(): string {
  return (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");
}

function buildUrl(r2Prefix: string, filename: string): string {
  if (process.env.NODE_ENV === "development") {
    return `/api/gis-local/${r2Prefix}${filename}`;
  }
  return `${getR2BaseUrl()}/${r2Prefix}${filename}`;
}

async function fetchAndConvert(url: string, signal: AbortSignal): Promise<FeatureCollection<Geometry>> {
  const res = await fetch(url, {
    signal,
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const topology = (await res.json()) as Topology;
  const objectName = Object.keys(topology.objects)[0];
  if (!objectName) throw new Error("TopoJSON に objects が見つかりません");

  return topojsonClient.feature(
    topology,
    topology.objects[objectName] as never
  ) as unknown as FeatureCollection<Geometry>;
}

export interface KsjDataState {
  geojson: FeatureCollection<Geometry> | null;
  loading: boolean;
  error: string | null;
  featureCount: number;
}

/**
 * KSJ TopoJSON を R2 から取得して GeoJSON に変換するフック
 *
 * @param r2Prefix  R2 上のプレフィックス（例: "gis/mlit-ksj/N02/22/"）
 * @param filename  ファイル名（例: "national.topojson" / "13.topojson"）
 */
export function useKsjData(
  r2Prefix: string | null,
  filename: string | null
): KsjDataState {
  const [state, setState] = useState<KsjDataState>({
    geojson: null,
    loading: false,
    error: null,
    featureCount: 0,
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!r2Prefix || !filename) {
      setState({ geojson: null, loading: false, error: null, featureCount: 0 });
      return;
    }

    const url = buildUrl(r2Prefix, filename);

    // L3 キャッシュヒット
    if (topoCache.has(url)) {
      const cached = topoCache.get(url)!;
      setState({ geojson: cached, loading: false, error: null, featureCount: cached.features.length });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchAndConvert(url, controller.signal)
      .then((geojson) => {
        topoCache.set(url, geojson); // L3 キャッシュに格納
        setState({ geojson, loading: false, error: null, featureCount: geojson.features.length });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setState({ geojson: null, loading: false, error: err.message, featureCount: 0 });
      });

    return () => controller.abort();
  }, [r2Prefix, filename]);

  return state;
}
