import { SavedMetadataItem } from "@/lib/estat-api/types/meta-info";

export interface SavedListProps {
  data: SavedMetadataItem[];
  loading: boolean;
  onView: (item: SavedMetadataItem) => void;
  onDelete: (id: string) => void;
}
