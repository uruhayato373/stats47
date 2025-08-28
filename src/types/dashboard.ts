export type WidgetType = 'kpi' | 'chart' | 'map' | 'table' | 'text';

export interface GridArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  gridArea: GridArea;
  title: string;
  dataSource?: string;
  config?: {
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    colorScheme?: 'blues' | 'reds' | 'greens' | 'purples';
    showLegend?: boolean;
    interactive?: boolean;
    [key: string]: any;
  };
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  gap: number;
  margin?: number;
}

export interface FilterState {
  selectedYear: number;
  selectedPrefecture: string | null;
  selectedCategory: string;
  selectedRegion?: string;
}

export interface KPIData {
  title: string;
  value: number | string;
  unit?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  description?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  year?: string;
  category?: string;
  [key: string]: any;
}

export type ChartData = ChartDataPoint[];

export interface MapDataPoint {
  code: string;
  name: string;
  value: number;
  coordinates?: [number, number];
}

export type MapData = MapDataPoint[];