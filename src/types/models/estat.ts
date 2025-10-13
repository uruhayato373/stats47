// e-Stat API関連の型定義

export interface SavedEstatMetainfoItem {
  id: string;
  stats_data_id: string;
  title: string;
  stat_name: string;
  ranking_key: string | null;
  created_at: string;
  updated_at: string;
  item_count: number;
}

export interface SavedMetadataItem {
  id?: number;
  stats_data_id: string;
  stat_name: string;
  title: string;
  ranking_key: string | null;
  cat01?: string;
  item_name?: string;
  unit?: string;
  updated_at: string;
  created_at: string;
}
