"use client";

import { MigrationFlowReel, MIGRATION_FLOW_DURATION } from "@stats47/migration-flow";

import { ReelPlayer } from "@/components/charts/ReelPlayer";

import { loadMigrationFlowBundle, type MigrationFlowBundle } from "../lib/load-data";

interface Props {
  /** 初期表示の焦点県コード（2 桁、既定: 28 = 兵庫県） */
  initialPrefCode?: string;
  /** 都道府県セレクタを表示するか（エリアページ埋め込み時は false） */
  showSelector?: boolean;
  /** controlled 焦点県（指定時は内部 state より優先。親が焦点県を持つ場合に使う） */
  prefCode?: string;
}

function renderMigrationFlow(bundle: MigrationFlowBundle, frame: number) {
  return (
    <MigrationFlowReel
      frame={frame}
      topology={bundle.topology}
      data={bundle.data}
      cityTopology={bundle.cityTopology}
      municipalities={bundle.municipalities}
      theme="light"
    />
  );
}

/** 県間の人口移動フローの再生 (共通の ReelPlayer に読み込みと描画だけを渡す) */
export function MigrationFlowPlayer({ initialPrefCode = "28", showSelector = true, prefCode }: Props) {
  return (
    <ReelPlayer
      initialPrefCode={initialPrefCode}
      prefCode={prefCode}
      showSelector={showSelector}
      selectorLabel="焦点の都道府県"
      load={loadMigrationFlowBundle}
      durationInFrames={MIGRATION_FLOW_DURATION}
      renderFrame={renderMigrationFlow}
      note="都道府県を選ぶと、その県を焦点にした人口移動フローに切り替わります。"
    />
  );
}
