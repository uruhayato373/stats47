import type { SlideData } from "../../types";
import { fiscalIndicatorsSlides } from "./fiscal-indicators";

const SLIDE_REGISTRY: Record<string, SlideData[]> = {
  "fiscal-indicators": fiscalIndicatorsSlides,
};

export function getSlideSet(key: string): SlideData[] | undefined {
  return SLIDE_REGISTRY[key];
}
