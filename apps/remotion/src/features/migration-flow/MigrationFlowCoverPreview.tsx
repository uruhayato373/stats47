import React from "react";

import { MigrationFlowCover } from "@stats47/migration-flow";

import { useMigrationFlowData } from "./useMigrationFlowData";

interface Props {
  /** 焦点県コード (2 桁) */
  focusPrefCode?: string;
}

export const MigrationFlowCoverPreview: React.FC<Props> = ({
  focusPrefCode = "13",
}) => {
  const { topology, data, cityTopology, municipalities, loading } =
    useMigrationFlowData(focusPrefCode);

  if (loading || !topology || !data) return null;

  return (
    <MigrationFlowCover
      topology={topology}
      data={data}
      cityTopology={cityTopology}
      municipalities={municipalities}
    />
  );
};
