import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import {
  PORTS_SNAPSHOT_KEY,
  PORT_STATS_YEARS_KEY,
  portStatsByYearKey,
  type PortMetaRow,
  type PortsSnapshot,
  type PortStatsByYearSnapshot,
  type PortStatsYearsSnapshot,
} from "./snapshot-types";

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

let cachedPorts: PortMetaRow[] | null = null;
let cachedYears: string[] | null = null;

async function loadPorts(): Promise<PortMetaRow[]> {
  if (cachedPorts) return cachedPorts;
  const snapshot = await fetchFromR2AsJson<PortsSnapshot>(PORTS_SNAPSHOT_KEY);
  cachedPorts = snapshot?.ports ?? [];
  return cachedPorts;
}

async function loadYears(): Promise<string[]> {
  if (cachedYears) return cachedYears;
  const snapshot = await fetchFromR2AsJson<PortStatsYearsSnapshot>(
    PORT_STATS_YEARS_KEY,
  );
  cachedYears = snapshot?.years ?? [];
  return cachedYears;
}

function buildPortWithStats(
  port: PortMetaRow,
  metrics: Map<string, number> | undefined,
  year: string,
): PortWithStats {
  return {
    portCode: port.portCode,
    portName: port.portName,
    prefectureCode: port.prefectureCode,
    prefectureName: port.prefectureName,
    latitude: port.latitude,
    longitude: port.longitude,
    portGrade: port.portGrade,
    administrator: port.administrator,
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
}

export async function loadPortData(): Promise<{
  ports: PortWithStats[];
  years: string[];
}> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return { ports: [], years: [] };
  }

  try {
    const [ports, years] = await Promise.all([loadPorts(), loadYears()]);
    const latestYear = years[0] || "2023";

    const yearSnapshot = await fetchFromR2AsJson<PortStatsByYearSnapshot>(
      portStatsByYearKey(latestYear),
    );
    const statsMap = new Map<string, Map<string, number>>();
    for (const s of yearSnapshot?.rows ?? []) {
      let m = statsMap.get(s.portCode);
      if (!m) {
        m = new Map();
        statsMap.set(s.portCode, m);
      }
      m.set(s.metricKey, s.value);
    }

    const portsWithStats = ports
      .map((p) => buildPortWithStats(p, statsMap.get(p.portCode), latestYear))
      .sort((a, b) => (b.cargoTotal ?? 0) - (a.cargoTotal ?? 0));

    return { ports: portsWithStats, years };
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "loadPortData: snapshot fetch failed",
    );
    return { ports: [], years: [] };
  }
}
