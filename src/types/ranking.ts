export interface RankingItem {
  rank: number;
  code: string;
  name: string;
  value: number;
  deviation: number;
  change?: number;
  changeRate?: number;
  previousValue?: number;
  unit?: string;
}

export interface RankingMetadata {
  title: string;
  category: string;
  year: string;
  dataSource: string;
  updateDate: string;
  description?: string;
  totalCount: number;
}

export interface RankingData {
  metadata: RankingMetadata;
  items: RankingItem[];
  statistics: {
    average: number;
    median: number;
    standardDeviation: number;
    max: RankingItem;
    min: RankingItem;
  };
}

export interface RankingConfig {
  id: string;
  title: string;
  statsDataId: string;
  year: string;
  category: string;
  tags: string[];
  description?: string;
}

export interface RankingTableColumn {
  key: keyof RankingItem | 'actions';
  label: string;
  sortable?: boolean;
  formatter?: (value: any, item: RankingItem) => string | React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}