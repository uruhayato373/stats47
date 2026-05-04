#!/usr/bin/env tsx
/**
 * ranking_page_cards (20 行) → page_components + page_component_assignments への migration (PR-7)
 *
 * - page_components: 各 card を unique な component_key で登録
 *   componentKey = 旧 ranking_page_cards.id (e.g. "rpc-job-market-trend")
 * - page_component_assignments: page_type='ranking', page_key=<rankingKey>, component_key=<above>
 *
 * 移行後 ranking_page_cards は次 commit で DROP する。
 *
 * Usage: npx tsx packages/database/scripts/migrate-ranking-page-cards-to-page-components.ts [--dry-run]
 */

import Database from "better-sqlite3";
import { LOCAL_DB_PATHS } from "../src/config/local-db-paths";

const DRY_RUN = process.argv.includes("--dry-run");
const dbPath = LOCAL_DB_PATHS.STATIC.getPath();
const db = new Database(dbPath);

interface OldCard {
  id: string;
  ranking_key: string;
  component_type: string;
  display_order: number;
  title: string | null;
  component_props: string | null;
  is_active: number;
  created_at: string | null;
  updated_at: string | null;
}

const cards = db
  .prepare(
    "SELECT id, ranking_key, component_type, display_order, title, component_props, is_active, created_at, updated_at FROM ranking_page_cards ORDER BY ranking_key, display_order"
  )
  .all() as OldCard[];

console.log(`旧 ranking_page_cards: ${cards.length} 行`);

const insertComponent = db.prepare(`
  INSERT INTO page_components (
    chart_key, component_type, title, component_props,
    is_active, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(chart_key) DO UPDATE SET
    component_type = excluded.component_type,
    title = excluded.title,
    component_props = excluded.component_props,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at
`);

const insertAssignment = db.prepare(`
  INSERT INTO page_component_assignments (
    page_type, page_key, chart_key, sort_order, created_at
  ) VALUES ('ranking', ?, ?, ?, ?)
`);

const txn = db.transaction(() => {
  for (const c of cards) {
    if (!DRY_RUN) {
      insertComponent.run(
        c.id,
        c.component_type,
        c.title ?? "",
        c.component_props ?? "{}",
        c.is_active,
        c.created_at,
        c.updated_at
      );
      insertAssignment.run(
        c.ranking_key,
        c.id,
        c.display_order,
        c.created_at
      );
    }
    console.log(
      `  ${c.ranking_key} → component_key=${c.id} sort_order=${c.display_order}`
    );
  }
});

if (DRY_RUN) {
  console.log("[DRY RUN] 実際の INSERT は行いません");
} else {
  txn();
  const componentCount = db
    .prepare("SELECT COUNT(*) AS c FROM page_components WHERE chart_key LIKE 'rpc-%'")
    .get() as { c: number };
  const assignmentCount = db
    .prepare(
      "SELECT COUNT(*) AS c FROM page_component_assignments WHERE page_type = 'ranking'"
    )
    .get() as { c: number };
  console.log(
    `\n✅ 移行完了: page_components(rpc-) ${componentCount.c} 行, page_component_assignments(ranking) ${assignmentCount.c} 行`
  );
}

db.close();
