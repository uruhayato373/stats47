import "server-only";

export const PORTS_SNAPSHOT_KEY = "app/ports/all.json";

export interface PortMetaRow {
  portCode: string;
  portName: string;
  prefectureCode: string;
  prefectureName: string;
  latitude: number | null;
  longitude: number | null;
  portGrade: string | null;
  administrator: string | null;
}

export interface PortsSnapshot {
  generatedAt: string;
  ports: PortMetaRow[];
}

export interface PortStatRow {
  portCode: string;
  metricKey: string;
  value: number;
  unit: string;
}

export interface PortStatsByYearSnapshot {
  generatedAt: string;
  year: string;
  rows: PortStatRow[];
}

export interface PortStatsByPortSnapshot {
  generatedAt: string;
  portCode: string;
  rows: Array<{
    year: string;
    metricKey: string;
    value: number;
    unit: string;
  }>;
}

export interface PortStatsYearsSnapshot {
  generatedAt: string;
  years: string[];
}

export const PORT_STATS_YEARS_KEY = "app/port-statistics/years.json";

export function portStatsByYearKey(year: string): string {
  return `app/port-statistics/by-year/${encodeURIComponent(year)}.json`;
}

export function portStatsByPortKey(portCode: string): string {
  return `app/port-statistics/by-port/${encodeURIComponent(portCode)}.json`;
}
