import "server-only";

import { loadContentOperations } from "../content-operations/load";
import type { ContentOperationsResponse } from "../contracts/types";
import { projectRoot } from "./project-root";
import { cached, TTL, wrap, type Wrapped } from "./state-io";

export function contentOperations(): Wrapped<ContentOperationsResponse> {
  return cached("content-operations", TTL.daily, () =>
    wrap(() => loadContentOperations(projectRoot())),
  );
}
