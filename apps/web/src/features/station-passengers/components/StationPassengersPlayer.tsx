"use client";

import { StationPassengersReel, STATION_PASSENGERS_DURATION } from "@stats47/station-passengers";

import { ReelPlayer } from "@/components/charts/ReelPlayer";

import { loadStationPassengersBundle, type StationPassengersBundle } from "../lib/load-data";

interface Props {
  /** 初期表示の県コード（2 桁） */
  initialPrefCode?: string;
  /** 都道府県セレクタを表示するか */
  showSelector?: boolean;
}

function renderStationPassengers(bundle: StationPassengersBundle, frame: number) {
  return (
    <StationPassengersReel
      frame={frame}
      topology={bundle.topology}
      data={bundle.data}
      railLines={bundle.railLines}
    />
  );
}

/** 駅別乗降客数の再生 (共通の ReelPlayer に読み込みと描画だけを渡す) */
export function StationPassengersPlayer({ initialPrefCode = "22", showSelector = true }: Props) {
  return (
    <ReelPlayer
      initialPrefCode={initialPrefCode}
      showSelector={showSelector}
      selectorLabel="都道府県"
      load={loadStationPassengersBundle}
      durationInFrames={STATION_PASSENGERS_DURATION}
      renderFrame={renderStationPassengers}
      note="円の大きさは 1 日あたりの駅別乗降客数。2019〜2023 年度の推移を表示します。"
    />
  );
}
