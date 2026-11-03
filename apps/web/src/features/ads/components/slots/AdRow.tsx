import { cn } from "@stats47/components";

import { adSlotBox } from "@/lib/ad-placements";
import { AdSenseAd, type AdSlotConfig } from "@/lib/google-adsense";

import {
  COLUMN_CLASS,
  ITEM_VISIBILITY_CLASS,
  NativeBannerTile,
} from "../NativeAffiliateRow";

import type { ResolvedAffiliateBanner } from "../../types";

/** 広告の段の 1 枠。AdSense (300×250) か PR (アフィリエイトのバナー) */
export type AdRowCell =
  | { kind: "adsense"; slot: AdSlotConfig }
  | { kind: "affiliate"; banner: ResolvedAffiliateBanner };

interface AdRowProps {
  /** 左から順の枠 (最大 3)。本文の幅に原寸 300px のまま入る数だけ出し、入らない分は出さない */
  cells: AdRowCell[];
  /** アフィリエイトの計測の position (GA4 の link_position) */
  position: string;
  /** アフィリエイトの計測の category の代わり (バナーに vertical が無いとき) */
  trackingCategory: string;
}

/**
 * 本文の広告の段 (2026-11-03 オーナー決定)。AdSense と PR を 1 行に並べ、本文の幅で枠の数を決める
 * (608px 未満 1 枠 / 608px 以上 2 枠 / 916px 以上 3 枠。PR の列と同じ境界)。入らない枠は折り返さずに出さない
 * (広告が縦に続かないように)。モバイルは先頭の 1 枠だけが出るので、段ごとに先頭の種類を変えて上下で交互にする。
 *
 * 表記は枠ごと (AdSense は「広告」、アフィリエイトは「PR」。景品表示法のステマ告示の表示を兼ねる)。
 * 出していない枠の AdSense は display:none なので遅延読み込みが発火せず、広告のリクエストも飛ばない
 * (manual-ad-policy.ts と同じ仕組み)。AdSense は自動広告なしで再開しているので (2026-10-11)、モバイルの先頭の枠にも出す。
 */
export function AdRow({ cells, position, trackingCategory }: AdRowProps) {
  const visible = cells.slice(0, 3);
  if (visible.length === 0) return null;
  return (
    <div data-ad-row={position} className="@container w-full p-4">
      <div className={`grid items-start justify-center gap-2 ${COLUMN_CLASS[visible.length]}`}>
        {visible.map((cell, index) => {
          const label = cell.kind === "adsense" ? "広告" : "PR";
          return (
            <div
              key={cell.kind === "adsense" ? cell.slot.slotId : cell.banner.id}
              data-ad-cell={label}
              // 開発中は ins が無いので、撮影 (capture-ad-layout.ts) がユニットを引けるよう slotId を載せる
              data-ad-slot-id={cell.kind === "adsense" ? cell.slot.slotId : undefined}
              className={cn("flex min-w-0 flex-col gap-2", ITEM_VISIBILITY_CLASS[index])}
            >
              <span className="text-xs font-medium leading-none text-muted-foreground">{label}</span>
              {cell.kind === "adsense" ? (
                <div className="flex w-full justify-center">
                  <AdSenseAd
                    slotId={cell.slot.slotId}
                    format={cell.slot.format}
                    showLabel={false}
                    slotBox={adSlotBox("adsense-body")}
                  />
                </div>
              ) : (
                <NativeBannerTile
                  banner={cell.banner}
                  position={position}
                  trackingCategory={trackingCategory}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
