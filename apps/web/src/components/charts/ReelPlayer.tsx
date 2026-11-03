"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { PREFECTURE_LIST_2DIGIT } from "@stats47/area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";

/** composition の設計フレームレート・サイズ (Remotion の 1920x1080 をコンテナ幅に縮めて描く) */
const FPS = 30;
const COMPOSITION_WIDTH = 1920;
const COMPOSITION_HEIGHT = 1080;

interface ReelPlayerProps<B> {
  /** 初期表示の県コード (2 桁) */
  initialPrefCode: string;
  /** 県を親が持つときに渡す (指定時は内部の選択より優先) */
  prefCode?: string;
  /** 都道府県の選択を出すか (地域のページに埋め込むときは false) */
  showSelector?: boolean;
  /** 選択の見出し (「都道府県」「焦点の都道府県」など) */
  selectorLabel: string;
  /** 県のデータを読む */
  load: (prefCode: string) => Promise<B>;
  /** 1 周のフレーム数 */
  durationInFrames: number;
  /** 読み込んだデータとフレームから Remotion の composition を描く */
  renderFrame: (bundle: B, frame: number) => ReactNode;
  /** プレイヤーの下の注記 1 行 */
  note: ReactNode;
}

/**
 * Remotion の composition をページの中でループ再生する共通のプレイヤー。県の選択・県ごとの読み込み・
 * requestAnimationFrame でのフレーム送り (30fps 相当)・コンテナ幅への縮小・読み込み中/失敗の表示を持つ。
 * 人口移動フローと駅別乗降客数で共用する (2026-11-03)。
 */
export function ReelPlayer<B>({
  initialPrefCode,
  prefCode: controlledPref,
  showSelector = true,
  selectorLabel,
  load,
  durationInFrames,
  renderFrame,
  note,
}: ReelPlayerProps<B>) {
  const [internalPref, setPrefCode] = useState(initialPrefCode);
  const prefCode = controlledPref ?? internalPref;
  /** 読み込み結果。どの prefCode のものかを保持し loading/errored を派生させる */
  const [result, setResult] = useState<
    { prefCode: string; bundle: B } | { prefCode: string; error: true } | null
  >(null);
  const [frame, setFrame] = useState(0);
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);

  // 県が変わるたびにデータを読み込む (setState は async コールバック内のみ)
  useEffect(() => {
    let cancelled = false;
    load(prefCode)
      .then((bundle) => {
        if (!cancelled) setResult({ prefCode, bundle });
      })
      .catch(() => {
        if (!cancelled) setResult({ prefCode, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [load, prefCode]);

  const ready = result?.prefCode === prefCode;
  const bundle = ready && result && "bundle" in result ? result.bundle : null;
  const errored = ready && result != null && "error" in result;

  // requestAnimationFrame でフレームを駆動 (30fps 相当・ループ)
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setFrame((((now - start) / 1000) * FPS) % durationInFrames);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationInFrames]);

  // コンテナ幅に合わせて 1920x1080 を縮める
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
          <span className="text-sm text-muted-foreground">{selectorLabel}</span>
          <Select
            value={prefCode}
            items={PREFECTURE_LIST_2DIGIT.map((p) => ({ value: p.code, label: p.name }))}
            onValueChange={(value) => {
              if (value !== null) setPrefCode(value);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PREFECTURE_LIST_2DIGIT.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
            {renderFrame(bundle, frame)}
          </div>
        )}
        {!ready && (
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

      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
