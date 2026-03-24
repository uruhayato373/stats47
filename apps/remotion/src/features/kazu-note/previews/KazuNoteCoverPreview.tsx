import React from "react";
import { KazuNoteCover } from "../KazuNoteCover";
import type { SeriesName } from "../kazu-theme";

interface KazuNoteCoverPreviewProps {
  series?: SeriesName;
  day?: number;
  subtitle?: string;
}

export const KazuNoteCoverPreview: React.FC<KazuNoteCoverPreviewProps> = ({
  series = "ソバーキュリアス",
  day = 15,
  subtitle = "自分を馬鹿にしていたのは、自分だった",
}) => {
  return <KazuNoteCover series={series} day={day} subtitle={subtitle} />;
};
