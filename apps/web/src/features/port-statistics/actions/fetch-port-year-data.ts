"use server";

import { getDrizzle } from "@stats47/database/server";
import { ports, portStatistics } from "@stats47/database/schema";
import { eq } from "drizzle-orm";
import type { PortWithStats } from "../lib/load-port-data";

export interface PortTimeSeriesPoint {
  year: string;
  metricKey: string;
  value: number;
  unit: string;
}

/**
 * 特定港湾の全年度時系列データを取得するサーバーアクション
 */
export async function fetchPortTimeSeriesAction(
  portCode: string,
): Promise<PortTimeSeriesPoint[]> {
  const db = getDrizzle();
  const rows = await db
    .select({
      year: portStatistics.year,
      metricKey: portStatistics.metricKey,
      value: portStatistics.value,
      unit: portStatistics.unit,
    })
    .from(portStatistics)
    .where(eq(portStatistics.portCode, portCode));
  return rows;
}

/**
 * 指定年度の港湾統計データを取得するサーバーアクション
 */
export async function fetchPortYearDataAction(
  year: string,
): Promise<PortWithStats[]> {
  const db = getDrizzle();

  const allPorts = await db.select().from(ports);

  const stats = await db
    .select()
    .from(portStatistics)
    .where(eq(portStatistics.year, year));

  const statsMap = new Map<string, Map<string, number>>();
  for (const s of stats) {
    if (!statsMap.has(s.portCode)) {
      statsMap.set(s.portCode, new Map());
    }
    statsMap.get(s.portCode)!.set(s.metricKey, s.value);
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
        portGrade: p.portGrade ?? null,
        administrator: p.administrator ?? null,
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
}
