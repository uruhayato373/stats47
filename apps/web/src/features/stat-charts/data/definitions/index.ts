import type { DefinitionSetData } from "../../types";
import { revenueDefinition } from "./revenue";

const DEFINITION_REGISTRY: Record<string, DefinitionSetData> = {
  revenue: revenueDefinition,
};

export function getDefinitionSet(key: string): DefinitionSetData | undefined {
  return DEFINITION_REGISTRY[key];
}
