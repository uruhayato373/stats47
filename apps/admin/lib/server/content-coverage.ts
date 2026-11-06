import "server-only";

import { datasetPath } from "../../../../config/datasets.mjs";
import { readClassifyInputs } from "../../../../.claude/scripts/content-types/content-types-io.mjs";
import { buildContentCoverage, type CoverageMatrix, type TypeFitReview } from "../content-coverage";
import { projectRoot } from "./project-root";
import { readJson, type Wrapped } from "./state-io";

/** 展開状況の入力を読む。判定と同じ台帳を読み、事業イシューマップは読まない */
export function contentCoverage(): Wrapped<CoverageMatrix> {
  try {
    const { books, ...inputs } = readClassifyInputs(projectRoot());
    return buildContentCoverage({ ...inputs, products: books });
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export function typeFitReview(): Wrapped<TypeFitReview> {
  try {
    return readJson<TypeFitReview>(datasetPath("content.type-fit-review"));
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
