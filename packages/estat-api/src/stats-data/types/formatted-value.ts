import type { EstatClassId, EstatNote, FormattedTableInfo } from "./stats-data-response";

export type DimensionInfo = {
  readonly code: string;
  readonly name: string;
  readonly level?: string;
  readonly parentCode?: string;
  readonly unit?: string;
};

export type FormattedValue = {
  readonly value: number | null;
  readonly unit?: string | null;
  readonly dimensions: Partial<Record<EstatClassId, DimensionInfo>>;
};

export type FormattedEstatData = {
  readonly tableInfo: FormattedTableInfo;
  readonly values: FormattedValue[];
  readonly notes: EstatNote[];
};
