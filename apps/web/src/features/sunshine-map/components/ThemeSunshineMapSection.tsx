"use client";

import { useEffect, useRef, useState } from "react";

import { fetchSunshineMapMeta } from "../actions";

import { SunshineMapClient } from "./SunshineMapClient";

import type { SunshineMapMeta } from "../lib/types";

/**
 * 気候テーマ (/themes/climate) に埋め込む日照地図セクション。
 *
 * 旧 /gis-cross/sunshine-map 独立ページを 2026-05-29 に気候テーマへ統合した際、
 * 1km メッシュのラスター可視化を失わないよう本セクションとして移設。
 * ThemeMigrationFlowSection と同型 (client + IntersectionObserver lazy)。
 */
export function ThemeSunshineMapSection() {
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [meta, setMeta] = useState<SunshineMapMeta | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || loaded) return;
    let cancelled = false;
    fetchSunshineMapMeta().then((res) => {
      if (!cancelled) {
        setMeta(res);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [visible, loaded]);

  return (
    <section ref={ref}>
      <h2 className="mb-3 text-xl font-bold text-foreground">
        日本の日照地図
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        全国の年間日照時間を 1km メッシュで可視化します。都道府県ランキングでは
        見えない、県内の山間部と平野部、太平洋側と日本海側の日照差が地図に表れます。
      </p>

      {loaded ? (
        <SunshineMapClient meta={meta} />
      ) : (
        <div
          className="w-full rounded-md border bg-muted"
          style={{ aspectRatio: "16 / 9" }}
        />
      )}
    </section>
  );
}
