import { FormattedValue } from "@/lib/estat/types";

export interface EstatPrefectureDataTableProps {
  data: FormattedValue[];
  className?: string;
  rankingDirection?: "asc" | "desc";
}

export type SortField = "rank" | "prefecture" | "value";
export type SortDirection = "asc" | "desc";
