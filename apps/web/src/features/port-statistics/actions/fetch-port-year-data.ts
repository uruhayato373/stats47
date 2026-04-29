"use server";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import {
  PORTS_SNAPSHOT_KEY,
  portStatsByPortKey,
  portStatsByYearKey,
  type PortsSnapshot,
  type PortStatsByPortSnapshot,
  type PortStatsByYearSnapshot,
} from "../lib/snapshot-types";

import type { PortWithStats } from "../lib/load-port-data";

export interface PortTimeSeriesPoint {
  year: string;
  metricKey: string;
  value: number;
  unit: string;
}

/**
 * 特定港湾の全年度時系列データを取得 (R2 by-port snapshot 経由)。
 */
export async function fetchPortTimeSeriesAction(
  portCode: string,
): Promise<PortTimeSeriesPoint[]> {
  try {
    const snapshot = await fetchFromR2AsJson<PortStatsByPortSnapshot>(
      portStatsByPortKey(portCode),
    );
    return snapshot?.rows ?? [];
  } catch (error) {
    logger.error(
      { portCode, error: error instanceof Error ? error.message : String(error) },
      "fetchPortTimeSeriesAction: snapshot fetch failed",
    );
    return [];
  }
}

/**
 * 指定年度の港湾統計データを取得 (R2 by-year snapshot 経由)。
 */
export async function fetchPortYearDataAction(
  year: string,
): Promise<PortWithStats[]> {
  try {
    const [portsSnap, yearSnap] = await Promise.all([
      fetchFromR2AsJson<PortsSnapshot>(PORTS_SNAPSHOT_KEY),
      fetchFromR2AsJson<PortStatsByYearSnapshot>(portStatsByYearKey(year)),
    ]);

    const allPorts = portsSnap?.ports ?? [];
    const stats = yearSnap?.rows ?? [];

    const statsMap = new Map<string, Map<string, number>>();
    for (const s of stats) {
      let m = statsMap.get(s.portCode);
      if (!m) {
        m = new Map();
        statsMap.set(s.portCode, m);
      }
      m.set(s.metricKey, s.value);
    }

    return allPorts
      .map((p) => {
        const metrics = statsMap.get(p.portCode);
        return {
          portCode: p.portCode,
          portName: p.portName,
          prefectureCode: p.prefectureCode,
          prefectureName: p.prefectureName,
          latitude: p.latitude,
          longitude: p.longitude,
          portGrade: p.portGrade,
          administrator: p.administrator,
          cargoTotal: metrics?.get("cargo_total") ?? null,
          shipsTotal: metrics?.get("ships_total") ?? null,
          cargoExport: metrics?.get("cargo_export") ?? null,
          cargoImport: metrics?.get("cargo_import") ?? null,
          cargoCoastalOut: metrics?.get("cargo_coastal_out") ?? null,
          cargoCoastalIn: metrics?.get("cargo_coastal_in") ?? null,
          passengersTotal: metrics?.get("passengers_total") ?? null,
          passengersBoarding: metrics?.get("passengers_boarding") ?? null,
          passengersLanding: metrics?.get("passengers_landing") ?? null,
          containerTonnage: metrics?.get("container_tonnage") ?? null,
          shipsTonnage: metrics?.get("ships_tonnage") ?? null,
          vehicleFerryTotal: metrics?.get("vehicle_ferry_total") ?? null,
          vehicleFerryTruck: metrics?.get("vehicle_ferry_truck") ?? null,
          vehicleFerryCar: metrics?.get("vehicle_ferry_car") ?? null,
          latestYear: year,
        };
      })
      .sort((a, b) => (b.cargoTotal ?? 0) - (a.cargoTotal ?? 0));
  } catch (error) {
    logger.error(
      { year, error: error instanceof Error ? error.message : String(error) },
      "fetchPortYearDataAction: snapshot fetch failed",
    );
    return [];
  }
}
