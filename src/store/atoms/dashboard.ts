import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { DashboardWidget, DashboardLayout, FilterState } from '@/types/dashboard';

// ダッシュボードレイアウト状態
export const dashboardLayoutAtom = atomWithStorage<DashboardLayout>('dashboardLayout', {
  columns: 12,
  rowHeight: 100,
  gap: 16,
});

// ウィジェット配置状態
export const widgetsAtom = atom<DashboardWidget[]>([
  {
    id: 'kpi-population',
    type: 'kpi',
    gridArea: { x: 0, y: 0, w: 3, h: 1 },
    title: '総人口',
    dataSource: '/api/estat/population/total',
  },
  {
    id: 'chart-trend',
    type: 'chart',
    gridArea: { x: 0, y: 1, w: 6, h: 3 },
    title: '人口推移',
    dataSource: '/api/estat/population/trend',
    config: {
      chartType: 'line',
      showLegend: true,
    },
  },
  {
    id: 'map-density',
    type: 'map',
    gridArea: { x: 6, y: 1, w: 6, h: 4 },
    title: '人口密度マップ',
    dataSource: '/api/estat/population/by-prefecture',
    config: {
      colorScheme: 'blues',
      showLegend: true,
      interactive: true,
    },
  },
]);

// フィルター状態
export const selectedYearAtom = atom<number>(2024);
export const selectedPrefectureAtom = atom<string | null>(null);
export const selectedCategoryAtom = atom<string>('population');
export const selectedRegionAtom = atom<string | null>(null);

// ダッシュボード編集モード
export const isEditModeAtom = atom(false);

// ウィンドウサイズ（レスポンシブ用）
export const windowWidthAtom = atom<number>(1200);

// フィルター状態の複合atom
export const filterStateAtom = atom<FilterState>(
  (get) => ({
    selectedYear: get(selectedYearAtom),
    selectedPrefecture: get(selectedPrefectureAtom),
    selectedCategory: get(selectedCategoryAtom),
    selectedRegion: get(selectedRegionAtom),
  }),
  (get, set, newFilter: Partial<FilterState>) => {
    if (newFilter.selectedYear !== undefined) {
      set(selectedYearAtom, newFilter.selectedYear);
    }
    if (newFilter.selectedPrefecture !== undefined) {
      set(selectedPrefectureAtom, newFilter.selectedPrefecture);
    }
    if (newFilter.selectedCategory !== undefined) {
      set(selectedCategoryAtom, newFilter.selectedCategory);
    }
    if (newFilter.selectedRegion !== undefined) {
      set(selectedRegionAtom, newFilter.selectedRegion);
    }
  }
);

// レスポンシブグリッド設定
export const responsiveGridAtom = atom((get) => {
  const layout = get(dashboardLayoutAtom);
  const windowWidth = get(windowWidthAtom);
  
  if (windowWidth < 640) {
    return { ...layout, columns: 4 };
  }
  if (windowWidth < 1024) {
    return { ...layout, columns: 8 };
  }
  return layout;
});

// ウィジェット操作用のatoms
export const addWidgetAtom = atom(
  null,
  (get, set, widget: DashboardWidget) => {
    const currentWidgets = get(widgetsAtom);
    set(widgetsAtom, [...currentWidgets, widget]);
  }
);

export const removeWidgetAtom = atom(
  null,
  (get, set, widgetId: string) => {
    const currentWidgets = get(widgetsAtom);
    set(widgetsAtom, currentWidgets.filter(w => w.id !== widgetId));
  }
);

export const updateWidgetAtom = atom(
  null,
  (get, set, widgetId: string, updates: Partial<DashboardWidget>) => {
    const currentWidgets = get(widgetsAtom);
    set(widgetsAtom, currentWidgets.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    ));
  }
);