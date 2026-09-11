import { lookupArea } from '@stats47/area';
import { MEDICAL_WORKFORCE_SOURCE as source } from '@stats47/data-configs/theme-catalog';

/** Synthetic counts with the official cohort size, not copied source observations. */
export function medicalWorkforceFixture() {
  const split = (total: number, groups: number, index: number) =>
    Math.floor(total / groups) + (index < total % groups ? 1 : 0);
  const areas = Array.from({ length: 47 }, (_, index) => {
    const areaCode = `${String(index + 1).padStart(2, '0')}000`;
    const totalPhysicians = split(source.nationalPhysicians, 47, index);
    return {
      areaCode,
      areaName: lookupArea(areaCode)!.areaName,
      totalPhysicians,
      ages: source.ageGroups.map((ageGroup, i) => ({
        ageGroup: String(ageGroup),
        physicians: split(totalPhysicians, source.ageGroups.length, i),
      })),
      specialties: source.specialties.map((specialty, i) => ({
        specialty: String(specialty),
        physicians: split(totalPhysicians, source.specialties.length, i),
      })),
    };
  });
  return {
    schemaVersion: 1,
    period: String(source.period),
    unit: '人',
    population: String(source.population),
    generatedAt: '2026-09-10T00:00:00.000Z',
    source: {
      title: String(source.title),
      url: String(source.url),
      files: source.files.map((file) => ({
        filename: String(file.filename),
        url: String(file.url),
        sha256: String(file.sha256),
      })),
    },
    areas,
    national: {
      areaCode: '00000',
      areaName: '全国',
      totalPhysicians: Number(source.nationalPhysicians),
      ages: source.ageGroups.map((ageGroup, index) => ({
        ageGroup: String(ageGroup),
        physicians: areas.reduce(
          (sum, area) => sum + area.ages[index].physicians,
          0
        ),
      })),
      specialties: source.specialties.map((specialty, index) => ({
        specialty: String(specialty),
        physicians: areas.reduce(
          (sum, area) => sum + area.specialties[index].physicians,
          0
        ),
      })),
    },
    notes: [...source.notes],
  };
}
