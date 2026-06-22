"use client";

import { useEffect, useRef, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";
import {
  StationPassengersReel,
  STATION_PASSENGERS_DURATION,
} from "@stats47/station-passengers";

import {
  loadStationPassengersBundle,
  type StationPassengersBundle,
} from "../lib/load-data";
import { PREFECTURES } from "../lib/prefectures";

/** composition の設計フレームレート・サイズ */
const FPS = 30;
const COMPOSITION_WIDTH = 1920;
const COMPOSITION_HEIGHT = 1080;

interface Props {
  /** 初期表示の県コード（2 桁） */
  initialPrefCode?: string;
  /** 都道府県セレクタを表示するか */
  showSelector?: boolean;
}

export function StationPassengersPlayer({
  initialPrefCode = "22",
  showSelector = true,
}: Props) {
  const [prefCode, setPrefCode] = useState(initialPrefCode);
  /** 読み込み結果。どの prefCode のものかを保持し loading/errored を派生させる */
  const [result, setResult] = useState<
    | { prefCode: string; bundle: StationPassengersBundle }
    | { prefCode: string; error: true }
    | null
  >(null);
  const [frame, setFrame] = useState(0);
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);

  // 県が変わるたびにデータを読み込む（setState は async コールバック内のみ）
  useEffect(() => {
    let cancelled = false;
    loadStationPassengersBundle(prefCode)
      .then((b) => {
        if (!cancelled) setResult({ prefCode, bundle: b });
      })
      .catch(() => {
        if (!cancelled) setResult({ prefCode, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [prefCode]);

  const ready = result?.prefCode === prefCode;
  const bundle = result && "bundle" in result ? result.bundle : null;
  const loading = !ready;
  const errored = ready && result != null && "error" in result;

  // requestAnimationFrame でフレームを駆動（30fps 相当・ループ）
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setFrame((((now - start) / 1000) * FPS) % STATION_PASSENGERS_DURATION);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // コンテナ幅に合わせて 1920x1080 をスケール
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / COMPOSITION_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div>
      {showSelector && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">都道府県</span>
          <Select value={prefCode} onValueChange={setPrefCode}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PREFECTURES.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* プレイヤー（16:9・1920x1080 をスケール） */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-md border bg-card"
        style={{ aspectRatio: "16 / 9" }}
      >
        {bundle && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: COMPOSITION_WIDTH,
              height: COMPOSITION_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <StationPassengersReel
              frame={frame}
              topology={bundle.topology}
              data={bundle.data}
              railLines={bundle.railLines}
            />
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            読み込み中…
          </div>
        )}
        {errored && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            データを読み込めませんでした。
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        円の大きさは 1 日あたりの駅別乗降客数。2019〜2023 年度の推移を表示します。
      </p>
    </div>
  );
}
