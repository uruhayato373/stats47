// e-Stat API関連の型定義

export interface SavedEstatMetainfoItem {
  id: string;
  stats_data_id: string;
  title: string;
  stat_name: string;
  created_at: string;
  updated_at: string;
  item_count: number;
}

export interface EstatMetainfoItem {
  id: string;
  stats_data_id: string;
  title: string;
  stat_name: string;
  created_at: string;
  updated_at: string;
  item_count: number;
}
