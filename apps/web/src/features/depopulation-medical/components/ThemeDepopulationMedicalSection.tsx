"use client";

import { useEffect, useRef, useState } from "react";

import {
  fetchDepopulationMedicalBase,
  type DepopulationMedicalBase,
} from "../actions";

import { DepopulationMedicalMapClient } from "./DepopulationMedicalMapClient";

/**
 * 医療 (healthcare) / 少子高齢化 (aging-society) テーマに埋め込む
 * 「過疎地域と医療機関」掛け合わせセクション。
 *
 * 旧 /gis-cross/depopulation-medical 独立ページを 2026-05-29 にテーマへ統合した際、
 * GIS オーバーレイ機能を失わないよう本セクションとして移設。
 * ThemeMigrationFlowSection と同型 (client + IntersectionObserver lazy)。
 * topology (~0.5-1MB) はスクロール到達時に server action で取得し、初期 SSR を膨らませない。
 */
export function ThemeDepopulationMedicalSection() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<DepopulationMedicalBase | null>(null);
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
    if (!visible || data) return;
    let cancelled = false;
    fetchDepopulationMedicalBase().then((res) => {
      if (!cancelled) setData(res);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, data]);

  return (
    <section ref={ref}>
      <h2 className="mb-3 text-xl font-bold text-slate-900">
        過疎地域と医療機関
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        県内の医療機関のうち過疎地域に立地する割合を 47 都道府県で可視化します。
        地図の県をクリックすると、過疎地域（面）と医療機関（点）の重なりを詳細表示します。
      </p>

      {data ? (
        <DepopulationMedicalMapClient
          summary={data.summary}
          topology={data.topology}
        />
      ) : (
        <div
          className="w-full rounded-md border bg-slate-100"
          style={{ aspectRatio: "16 / 9" }}
        />
      )}
    </section>
  );
}
