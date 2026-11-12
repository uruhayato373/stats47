'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, type ReactNode } from 'react';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';

import { SingleSelectToggleGroup } from '@/components/molecules/SingleSelectToggleGroup';

import { GEO_BASEMAP } from './leaflet-basemap';
import { createGeoCanvasRenderer } from './leaflet-canvas-renderer';

import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';

/** 全体へ合わせるときの余白と上限の拡大 (点が 1 つでも寄りすぎない) */
const FIT_OPTIONS = { padding: [16, 16] as [number, number], maxZoom: 11 };

/** 周辺の表示 (人口最多メッシュなど) と、その切り替えボタンの文言 */
export interface LeafletMapFocus {
  center: LatLngTuple;
  zoom: number;
  label: string;
  /** 全体を見るボタンの文言。既定は「離島を含む全県」 */
  wholeLabel?: string;
}

interface LeafletMapFrameProps {
  /** 地図の説明 (読み上げ用) */
  ariaLabel: string;
  /** 全体の範囲。開いたとき (focus が無いとき) と「全体」を選んだときにこの範囲へ合わせる */
  bounds: LatLngBoundsExpression;
  /** 渡すと「周辺 / 全体」の切り替えボタンを出し、最初は周辺を表示する */
  focus?: LeafletMapFocus;
  /** 周辺 / 全体を地図の外の操作で決めるときに渡す。渡すと枠の切り替えボタンは出さない */
  whole?: boolean;
  /** 切り替えボタンの右に並べる操作・注記 (区分の切り替えなど) */
  toolbar?: ReactNode;
  /** 地図の上に重ねる層 (GeoJSON・円・画像など) */
  children: ReactNode;
}

function FitView({ bounds, focus, whole }: { bounds: LatLngBoundsExpression; focus?: LeafletMapFocus; whole: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (focus && !whole) map.setView(focus.center, focus.zoom);
    else map.fitBounds(bounds, FIT_OPTIONS);
  }, [map, bounds, focus, whole]);
  return null;
}

/**
 * Leaflet の地図の共通の枠。背景タイル (地理院の淡色地図)・描画の後始末をする canvas・高さ・
 * 拡大の操作・表示範囲の合わせ方・「周辺 / 全体」の切り替えを持ち、各地図は層だけを渡す。
 * 高さは 480px / lg 620px、マウスのホイールでは拡大しない (ページを読む途中で地図が動かないように。2026-11-03 オーナー決定)。
 */
export function LeafletMapFrame({ ariaLabel, bounds, focus, whole: wholeProp, toolbar, children }: LeafletMapFrameProps) {
  const renderer = useState(() => createGeoCanvasRenderer())[0];
  const [wholeState, setWhole] = useState(false);
  const whole = wholeProp ?? wholeState;
  const showToggle = Boolean(focus) && wholeProp === undefined;
  const hasToolbar = showToggle || Boolean(toolbar);
  return (
    <div>
      {hasToolbar && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {focus && showToggle && (
            <SingleSelectToggleGroup
              aria-label="地図の範囲"
              value={whole ? 'whole' : 'focus'}
              onValueChange={value => setWhole(value === 'whole')}
              options={[
                { value: 'focus', label: focus.label },
                { value: 'whole', label: focus.wholeLabel ?? '離島を含む全県' },
              ]}
            />
          )}
          {toolbar}
        </div>
      )}
      <MapContainer
        renderer={renderer}
        preferCanvas
        bounds={bounds}
        zoomAnimation={false}
        minZoom={GEO_BASEMAP.minZoom}
        maxZoom={GEO_BASEMAP.maxZoom}
        scrollWheelZoom={false}
        className="isolate h-[480px] overflow-hidden rounded-card lg:h-[620px]"
        aria-label={ariaLabel}
      >
        <TileLayer url={GEO_BASEMAP.url} attribution={GEO_BASEMAP.attribution} />
        {children}
        <FitView bounds={bounds} focus={focus} whole={whole} />
      </MapContainer>
    </div>
  );
}
