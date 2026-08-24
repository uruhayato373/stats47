export type MunicipalityKind = 'city' | 'town' | 'village' | 'special-ward';

export type MunicipalityExcludedKind =
  | 'administrative-ward'
  | 'special-wards-aggregate';

interface MunicipalityEntityBase {
  code: string;
  name: string;
  prefectureCode: string;
}

export interface PublishableMunicipalityEntity extends MunicipalityEntityBase {
  disposition: 'publishable';
  kind: MunicipalityKind;
}

export interface ExcludedMunicipalityEntity extends MunicipalityEntityBase {
  disposition: 'excluded';
  kind: MunicipalityExcludedKind;
  reason: string;
  parentMunicipalityCode?: string;
}

export interface UnknownMunicipalityEntity extends MunicipalityEntityBase {
  disposition: 'unknown';
  kind: 'unknown';
  reason: string;
}

export type MunicipalityEntity =
  | PublishableMunicipalityEntity
  | ExcludedMunicipalityEntity
  | UnknownMunicipalityEntity;

export interface MunicipalityEntityPolicy {
  key: string;
  entities: MunicipalityEntity[];
}
