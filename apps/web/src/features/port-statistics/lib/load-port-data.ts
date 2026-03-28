import "server-only";

import { ports, portStatistics } from "@stats47/database/schema";
import { getDrizzle } from "@stats47/database/server";
import { eq, desc } from "drizzle-orm";

export interface PortWithStats {
  portCode: string;
  portName: string;
  prefectureCode: string;
  prefectureName: string;
  latitude: number | null;
  longitude: number | null;
  portGrade: string | null;
  administrator: string | null;
  cargoTotal: number | null;
  shipsTotal: number | null;
  cargoExport: number | null;
  cargoImport: number | null;
  cargoCoastalOut: number | null;
  cargoCoastalIn: number | null;
  passengersTotal: number | null;
  passengersBoarding: number | null;
  passengersLanding: number | null;
  containerTonnage: number | null;
  shipsTonnage: number | null;
  vehicleFerryTotal: number | null;
  vehicleFerryTruck: number | null;
  vehicleFerryCar: number | null;
  latestYear: string;
}

export async function loadPortData(): Promise<{
  ports: PortWithStats[];
  years: string[];
}> {
  const db = getDrizzle();

  // 利用可能な年を取得
  const yearRows = await db
    .selectDistinct({ year: portStatistics.year })
    .from(portStatistics)
    .orderBy(desc(portStatistics.year));
  const years = yearRows.map((r) => r.year);
  const latestYear = years[0] || "2023";

  // 全港湾 + 最新年の統計を取得
  const allPorts = await db.select().from(ports);

  // 最新年の統計を一括取得
  const latestStats = await db
    .select()
    .from(portStatistics)
    .where(eq(portStatistics.year, latestYear));

  // ポートコード → 統計マップ
  const statsMap = new Map<string, Map<string, number>>();
  for (const s of latestStats) {
    if (!statsMap.has(s.portCode)) {
      statsMap.set(s.portCode, new Map());
    }
    statsMap.get(s.portCode)!.set(s.metricKey, s.value);
  }

  const portsWithStats: PortWithStats[] = allPorts.map((p) => {
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
      latestYear,
    };
  });

  // 貨物量降順でソート
  portsWithStats.sort(
    (a, b) => (b.cargoTotal ?? 0) - (a.cargoTotal ?? 0)
  );

  return { ports: portsWithStats, years };
}

export async function loadPortYearData(
  portCode: string
): Promise<
  Array<{
    year: string;
    metricKey: string;
    value: number;
    unit: string;
  }>
> {
  const db = getDrizzle();
  return db
    .select({
      year: portStatistics.year,
      metricKey: portStatistics.metricKey,
      value: portStatistics.value,
      unit: portStatistics.unit,
    })
    .from(portStatistics)
    .where(eq(portStatistics.portCode, portCode))
    .orderBy(portStatistics.year);
}
