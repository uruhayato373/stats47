export interface SavedMetadataItem {
  id: string;
  statsDataId: string;
  title: string;
  statName: string;
  govOrg: string;
  surveyDate: string;
  savedAt: string;
}

export interface SavedListProps {
  data: SavedMetadataItem[];
  loading: boolean;
  onView: (item: SavedMetadataItem) => void;
  onDelete: (id: string) => void;
}
