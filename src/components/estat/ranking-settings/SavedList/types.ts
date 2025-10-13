import { SavedMetadataItem } from "@/types/models";

export interface SavedListProps {
  data: SavedMetadataItem[];
  loading: boolean;
  onView: (item: SavedMetadataItem) => void;
  onDelete: (id: string) => void;
}
