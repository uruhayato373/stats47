import { fetchCities } from '../repositories/fetch-cities';

import type { City } from '../types/city';
import type {
  MunicipalityEntity,
  MunicipalityEntityPolicy,
  MunicipalityKind,
  PublishableMunicipalityEntity,
} from '../types/municipality';

export const STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY =
  'standard-municipality-v1';

const PREFECTURE_CODE_RE = /^(0[1-9]|[1-3][0-9]|4[0-7])000$/;
const AREA_CODE_RE = /^\d{5}$/;

function leafName(cityName: string): string {
  const segments = cityName.trim().split(/\s+/);
  return segments[segments.length - 1] ?? cityName;
}

function resolvePublishableKind(city: City): MunicipalityKind | null {
  const name = leafName(city.cityName);
  if (name.endsWith('市')) return 'city';
  if (name.endsWith('町')) return 'town';
  if (name.endsWith('村')) return 'village';
  if (city.prefCode === '13000' && name.endsWith('区')) return 'special-ward';
  return null;
}

function assertBaseShape(city: City): void {
  if (!AREA_CODE_RE.test(city.cityCode)) {
    throw new Error(`municipality code must be 5 digits: ${city.cityCode}`);
  }
  if (!city.cityName.trim()) {
    throw new Error(`municipality name is empty: ${city.cityCode}`);
  }
}

/**
 * `cities.json` の storage 表現を、公開画面の自治体エンティティへ変換する。
 * level=3 は政令指定都市の行政区であり、自治体集合へ混ぜない。
 */
export function buildMunicipalityEntityPolicy(
  cities: readonly City[] = fetchCities()
): MunicipalityEntityPolicy {
  const byCode = new Map<string, City>();
  for (const city of cities) {
    assertBaseShape(city);
    if (byCode.has(city.cityCode)) {
      throw new Error(`duplicate municipality code: ${city.cityCode}`);
    }
    byCode.set(city.cityCode, city);
  }

  const entities: MunicipalityEntity[] = cities.map((city) => {
    if (city.level === '3') {
      const parent = byCode.get(city.prefCode);
      if (!parent || parent.level !== '2') {
        throw new Error(
          `administrative ward parent is missing: ${city.cityCode} -> ${city.prefCode}`
        );
      }
      if (!PREFECTURE_CODE_RE.test(parent.prefCode)) {
        throw new Error(
          `administrative ward parent prefecture is invalid: ${city.cityCode} -> ${parent.prefCode}`
        );
      }
      if (city.cityCode.slice(0, 2) !== parent.prefCode.slice(0, 2)) {
        throw new Error(
          `administrative ward parent prefecture mismatch: ${city.cityCode} -> ${parent.prefCode}`
        );
      }
      return {
        code: city.cityCode,
        name: city.cityName,
        prefectureCode: parent.prefCode,
        disposition: 'excluded',
        kind: 'administrative-ward',
        reason: '政令指定都市の行政区は基礎自治体ではないため',
        parentMunicipalityCode: parent.cityCode,
      };
    }

    if (!PREFECTURE_CODE_RE.test(city.prefCode)) {
      throw new Error(
        `municipality prefecture code is invalid: ${city.cityCode} -> ${city.prefCode}`
      );
    }
    if (city.cityCode.slice(0, 2) !== city.prefCode.slice(0, 2)) {
      throw new Error(
        `municipality prefecture mismatch: ${city.cityCode} -> ${city.prefCode}`
      );
    }

    if (city.cityCode === '13100' && leafName(city.cityName) === '特別区部') {
      return {
        code: city.cityCode,
        name: city.cityName,
        prefectureCode: city.prefCode,
        disposition: 'excluded',
        kind: 'special-wards-aggregate',
        reason: '東京23特別区の集約行であり個別自治体ではないため',
      };
    }

    const kind = resolvePublishableKind(city);
    if (!kind) {
      return {
        code: city.cityCode,
        name: city.cityName,
        prefectureCode: city.prefCode,
        disposition: 'unknown',
        kind: 'unknown',
        reason: '市・町・村・特別区のいずれかを決定できないため',
      };
    }

    return {
      code: city.cityCode,
      name: city.cityName,
      prefectureCode: city.prefCode,
      disposition: 'publishable',
      kind,
    };
  });

  return { key: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY, entities };
}

export function listPublishableMunicipalities(
  policy: MunicipalityEntityPolicy
): PublishableMunicipalityEntity[] {
  return policy.entities.filter(
    (entity): entity is PublishableMunicipalityEntity =>
      entity.disposition === 'publishable'
  );
}
