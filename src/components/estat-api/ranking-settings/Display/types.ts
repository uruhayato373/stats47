import { PrefectureRankingParams } from "@/types/models";

export interface DisplayProps {
  params: PrefectureRankingParams | null;
  onSettingsChange?: (settings: {
    map_color_scheme?: string;
    map_diverging_midpoint?: string;
    ranking_direction?: string;
    conversion_factor?: number;
    decimal_places?: number;
  }) => Promise<void>;
}
