/**
 * AREA_DATABOOK_TEMPLATE — 47 県共通の県データブック構成。
 *
 * 記録の正本は台帳 `areas.databook-template` (data/areas/databook/template.json + Schema)。ここは型を付けて export するだけ。
 * 規約: `.claude/rules/area-databook-standards.md`
 *
 * - chart ブロックは generator で `apps/web/scripts/data/page-components/area/<code>.json`
 *   に出力される (手編集禁止・byte 一致)。
 * - ranked-kpi-grid / gender-paired-kpi / agri-top10 は R2 `app/areas/<code>/databook.json`
 *   (exporter が values.json から値+全国順位を焼き込み) を app が読んで描画する。
 * - specialty-list / symbol-card は県の本文 (台帳 `areas.editorial`) を app が描画する。
 */
import data from "../../../../data/areas/databook/template.json";

import type { AreaDatabookTemplate } from "./types";

export const AREA_DATABOOK_TEMPLATE = data as AreaDatabookTemplate;
