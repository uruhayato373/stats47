"use client";

import { useEffect, useRef, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";
import { MigrationFlowReel, MIGRATION_FLOW_DURATION } from "@stats47/migration-flow";

import { loadMigrationFlowBundle, type MigrationFlowBundle } from "../lib/load-data";
import { PREFECTURES } from "../lib/prefectures";

/** composition の設計フレームレート */
const FPS = 30;
const COMPOSITION_WIDTH = 1920;
const COMPOSITION_HEIGHT = 1080;

interface Props {
  /** 初期表示の焦点県コード（2 桁、既定: 28 = 兵庫県） */
  initialPrefCode?: string;
  /** 都道府県セレクタを表示するか（エリアページ埋め込み時は false） */
  showSelector?: boolean;
  /** controlled 焦点県（指定時は内部 state より優先。親が焦点県を持つ場合に使う） */
  prefCode?: string;
}

export function MigrationFlowPlayer({
  initialPrefCode = "28",
  showSelector = true,
  prefCode: controlledPref,
}: Props) {
  const [internalPref, setPrefCode] = useState(initialPrefCode);
  const prefCode = controlledPref ?? internalPref;
  /** 読み込み結果。どの prefCode のものかを保持し loading/errored を派生させる */
  const [result, setResult] = useState<
    | { prefCode: string; bundle: MigrationFlowBundle }
    | { prefCode: string; error: true }
    | null
  >(null);
  const [frame, setFrame] = useState(0);
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);

  // 焦点県が変わるたびにデータを読み込む（setState は async コールバック内のみ）
  useEffect(() => {
    let cancelled = false;
    loadMigrationFlowBundle(prefCode)
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
      setFrame((((now - start) / 1000) * FPS) % MIGRATION_FLOW_DURATION);
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
      {/* 焦点県セレクタ */}
      {showSelector && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">焦点の都道府県</span>
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
        className="relative w-full overflow-hidden rounded-md border bg-white"
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
            <MigrationFlowReel
              frame={frame}
              topology={bundle.topology}
              data={bundle.data}
              cityTopology={bundle.cityTopology}
              municipalities={bundle.municipalities}
              theme="light"
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
        都道府県を選ぶと、その県を焦点にした人口移動フローに切り替わります。
      </p>
    </div>
  );
}
