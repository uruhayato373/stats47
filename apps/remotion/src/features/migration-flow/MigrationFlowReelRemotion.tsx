import React from "react";
import { useCurrentFrame } from "remotion";

import {
  MigrationFlowReel,
  type MigrationFlowReelProps,
} from "@stats47/migration-flow";

/**
 * Remotion 用ラッパー。共有パッケージの MigrationFlowReel に
 * useCurrentFrame() を frame として注入する。
 */
export const MigrationFlowReelRemotion: React.FC<
  Omit<MigrationFlowReelProps, "frame">
> = (props) => <MigrationFlowReel frame={useCurrentFrame()} {...props} />;
