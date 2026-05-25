import React from "react";

import type { MigrationFlowFormat, ThemeName } from "@stats47/migration-flow";

import { MigrationFlowReelRemotion } from "../MigrationFlowReelRemotion";
import { useMigrationFlowData } from "../useMigrationFlowData";

interface Props {
  theme?: ThemeName;
  /** 焦点県コード (2 桁 or 5 桁、既定: 28 = 兵庫県) */
  focusPrefCode?: string;
  /** 出力フォーマット (landscape 16:9 / portrait 9:16) */
  format?: MigrationFlowFormat;
}

export const MigrationFlowReelPreview: React.FC<Props> = ({
  theme = "light",
  focusPrefCode = "28",
  format = "landscape",
}) => {
  const { topology, data, cityTopology, municipalities, loading } =
    useMigrationFlowData(focusPrefCode);

  if (loading || !topology || !data) return null;

  return (
    <MigrationFlowReelRemotion
      topology={topology}
      data={data}
      cityTopology={cityTopology}
      municipalities={municipalities}
      theme={theme}
      format={format}
    />
  );
};
