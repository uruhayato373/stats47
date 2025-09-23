import { VisualizationSettings } from "@/lib/ranking/visualization-settings";

export interface VisualizationSettingsPanelProps {
  editableSettings: Partial<VisualizationSettings>;
  visualizationSettings: VisualizationSettings | null;
  params: PrefectureRankingParams | null;
  onSettingsChange: (settings: Partial<VisualizationSettings>) => void;
}

export interface PrefectureRankingParams {
  statsDataId: string;
  categoryCode?: string;
  timeCode?: string;
}
