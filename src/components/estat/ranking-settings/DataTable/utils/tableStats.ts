export interface DataTableItem {
  areaCode: string;
  areaName: string;
  numericValue: number | null;
  displayValue?: string;
  unit?: string;
  categoryCode: string;
  timeCode: string;
  rank?: number;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("ja-JP");
}

export function calculateStats(data: DataTableItem[]) {
  if (!data || data.length === 0) {
    return {
      count: 0,
      max: null,
      min: null,
      average: null,
    };
  }

  const values = data.map((item) => item.numericValue || 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const average = Math.round(
    values.reduce((sum, val) => sum + val, 0) / values.length
  );

  return {
    count: data.length,
    max,
    min,
    average,
  };
}

export function getRankBadgeClass(rank: number): string {
  if (rank <= 3) {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800";
      case 2:
        return "bg-gray-100 text-gray-800";
      case 3:
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  }
  return "bg-blue-100 text-blue-800";
}
