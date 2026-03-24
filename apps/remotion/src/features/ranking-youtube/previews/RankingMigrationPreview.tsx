import React from "react";
import type { ThemeName } from "@/shared";
import { RankingMigration } from "../RankingMigration";
import { migrationPreviewData } from "@/utils/preview-data-migration";

interface RankingMigrationPreviewProps {
  theme?: ThemeName;
  showSafeAreas?: boolean;
  framesPerPref?: number;
  precision?: number;
}

export const RankingMigrationPreview: React.FC<RankingMigrationPreviewProps> = ({
  theme = "light",
  showSafeAreas = false,
  framesPerPref,
  precision,
}) => {
  const { meta, entries, migrationData } = migrationPreviewData;

  return (
    <RankingMigration
      meta={meta}
      entries={entries}
      migrationData={migrationData}
      theme={theme}
      showSafeAreas={showSafeAreas}
      framesPerPref={framesPerPref}
      precision={precision ?? 1}
    />
  );
};
