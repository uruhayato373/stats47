/**
 * /themes/local-finance ダッシュボードを充実させるため、page_components テーブルに
 * 12 件のキュレーション済みコンポーネント定義を冪等に投入する。
 *
 * デジタル庁 Japan Dashboard (https://www.digital.go.jp/resources/japandashboard/municipal-finance)
 * の機能を都道府県別データで復元するための seed。
 *
 * 使用方法:
 *   cd /Users/minamidaisuke/stats47
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/seed-local-finance-page-components.ts
 *
 * 投入後は export-page-components-snapshot.ts で R2 へ反映:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-page-components-snapshot.ts
 */

import BetterSqlite3 from "better-sqlite3";
import dotenv from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";

import { LOCAL_DB_PATHS } from "../../../packages/database/src/config/local-db-paths";
import * as schema from "../../../packages/database/src/schema";

dotenv.config({ path: ".env.local" });

const PAGE_TYPE = "theme";
const PAGE_KEY = "local-finance";
const SOURCE_NAME = "社会・人口統計体系";
const SOURCE_LINK = "https://www.stat.go.jp/data/ssds/index.htm";

/**
 * panelTabs ラベル（packages/types/src/indicator-sets/local-finance.ts と厳密一致）
 * PrefectureStatsPanel は section === tab.label でフィルタする
 */
const SECTION = {
  health: "財政健全度",
  revenue: "歳入構造",
  expense: "歳出構造",
  income: "税収・所得",
} as const;

interface ComponentDef {
  componentKey: string;
  componentType: string;
  title: string;
  section: string;
  sortOrder: number;
  componentProps: Record<string, unknown>;
  sourceName?: string;
  sourceLink?: string;
  rankingLink?: string;
}

const COMPONENTS: ComponentDef[] = [
  /* ────────────── Section: 財政健全度 ────────────── */
  {
    componentKey: "kpi-lf-fiscal-strength",
    componentType: "kpi-card",
    title: "財政力指数",
    section: SECTION.health,
    sortOrder: 1,
    componentProps: {
      estatParams: { statsDataId: "0000010104", cdCat01: "D2101" },
    },
    rankingLink: "/ranking/fiscal-strength-index-prefecture",
  },
  {
    componentKey: "kpi-lf-current-balance",
    componentType: "kpi-card",
    title: "経常収支比率",
    section: SECTION.health,
    sortOrder: 2,
    componentProps: {
      estatParams: { statsDataId: "0000010104", cdCat01: "D2103" },
      unit: "％",
    },
    rankingLink: "/ranking/current-balance-ratio",
  },
  {
    componentKey: "kpi-lf-debt-service",
    componentType: "kpi-card",
    title: "実質公債費比率",
    section: SECTION.health,
    sortOrder: 3,
    componentProps: {
      estatParams: { statsDataId: "0000010104", cdCat01: "D2111" },
      unit: "％",
    },
    rankingLink: "/ranking/real-public-debt-service-ratio",
  },
  {
    componentKey: "kpi-lf-future-burden",
    componentType: "kpi-card",
    title: "将来負担比率",
    section: SECTION.health,
    sortOrder: 4,
    componentProps: {
      estatParams: { statsDataId: "0000010104", cdCat01: "D2112" },
      unit: "％",
    },
    rankingLink: "/ranking/future-burden-ratio",
  },
  {
    componentKey: "theme-lf-fiscal-ratios-trend",
    componentType: "line-chart",
    title: "財政力指数・経常収支比率の推移",
    section: SECTION.health,
    sortOrder: 10,
    componentProps: {
      estatParams: [
        { statsDataId: "0000010104", cdCat01: "D2101" },
        { statsDataId: "0000010104", cdCat01: "D2103" },
      ],
      labels: ["財政力指数", "経常収支比率"],
      seriesColors: ["#3b82f6", "#06b6d4"],
    },
  },
  {
    componentKey: "theme-lf-debt-trend",
    componentType: "line-chart",
    title: "実質公債費比率・将来負担比率の推移",
    section: SECTION.health,
    sortOrder: 20,
    componentProps: {
      estatParams: [
        { statsDataId: "0000010104", cdCat01: "D2111" },
        { statsDataId: "0000010104", cdCat01: "D2112" },
      ],
      labels: ["実質公債費比率", "将来負担比率"],
      seriesColors: ["#ef4444", "#f59e0b"],
    },
  },

  /* ────────────── Section: 歳入構造 ────────────── */
  {
    componentKey: "theme-lf-revenue-composition",
    componentType: "composition-chart",
    title: "歳入構成（地方税・交付税・国庫支出金）",
    section: SECTION.revenue,
    sortOrder: 10,
    componentProps: {
      statsDataId: "0000010204",
      segments: [
        { code: "#D0210101", label: "地方税", color: "#3b82f6" },
        { code: "#D0210201", label: "地方交付税", color: "#06b6d4" },
        { code: "#D0210301", label: "国庫支出金", color: "#8b5cf6" },
      ],
    },
  },
  {
    componentKey: "theme-lf-revenue-trend",
    componentType: "line-chart",
    title: "歳入構造比率の推移",
    section: SECTION.revenue,
    sortOrder: 20,
    componentProps: {
      estatParams: [
        { statsDataId: "0000010204", cdCat01: "#D0210101" },
        { statsDataId: "0000010204", cdCat01: "#D0210201" },
        { statsDataId: "0000010204", cdCat01: "#D0210301" },
      ],
      labels: ["地方税割合", "地方交付税割合", "国庫支出金割合"],
      seriesColors: ["#3b82f6", "#06b6d4", "#8b5cf6"],
    },
  },

  /* ────────────── Section: 歳出構造 ────────────── */
  {
    componentKey: "theme-lf-expense-composition",
    componentType: "composition-chart",
    title: "歳出構成（目的別）",
    section: SECTION.expense,
    sortOrder: 10,
    componentProps: {
      statsDataId: "0000010204",
      segments: [
        { code: "#D0320101", label: "人件費", color: "#ef4444" },
        { code: "#D0310301", label: "民生費", color: "#ec4899" },
        { code: "#D0311501", label: "教育費", color: "#3b82f6" },
        { code: "#D0311201", label: "土木費", color: "#f97316" },
      ],
    },
  },
  {
    componentKey: "theme-lf-per-capita-expense-trend",
    componentType: "line-chart",
    title: "1人当たり歳出決算総額の推移",
    section: SECTION.expense,
    sortOrder: 20,
    componentProps: {
      estatParams: [
        { statsDataId: "0000010204", cdCat01: "#D0330103" },
      ],
      labels: ["1人当たり歳出"],
      seriesColors: ["#3b82f6"],
    },
  },

  /* ────────────── Section: 税収・所得 ────────────── */
  {
    componentKey: "theme-lf-income-tax-trend",
    componentType: "line-chart",
    title: "1人当たり住民税・課税対象所得の推移",
    section: SECTION.income,
    sortOrder: 10,
    componentProps: {
      estatParams: [
        { statsDataId: "0000010204", cdCat01: "#D0220103" },
        { statsDataId: "0000010204", cdCat01: "#D02206" },
      ],
      labels: ["1人当たり住民税", "納税義務者1人当たり課税所得"],
      seriesColors: ["#06b6d4", "#8b5cf6"],
    },
  },
  {
    componentKey: "theme-lf-taxpayer-ratio-trend",
    componentType: "line-chart",
    title: "納税義務者割合の推移",
    section: SECTION.income,
    sortOrder: 20,
    componentProps: {
      estatParams: [
        { statsDataId: "0000010204", cdCat01: "#D02207" },
      ],
      labels: ["納税義務者割合"],
      seriesColors: ["#22c55e"],
    },
  },
];

function resolveDatabasePath(): string {
  if (process.env.LOCAL_DB_PATH && fs.existsSync(process.env.LOCAL_DB_PATH)) {
    return process.env.LOCAL_DB_PATH;
  }
  const standardPath = LOCAL_DB_PATHS.STATIC.getPath();
  if (!fs.existsSync(standardPath)) {
    throw new Error(`ローカル D1 SQLite が見つかりません: ${standardPath}`);
  }
  return standardPath;
}

async function main() {
  const dbPath = resolveDatabasePath();
  console.log(`📁 DB: ${dbPath}`);

  const sqlite = new BetterSqlite3(dbPath);
  const db = drizzle(sqlite, { schema });

  let inserted = 0;
  let updated = 0;

  for (const comp of COMPONENTS) {
    const existing = await db
      .select({ id: schema.pageComponents.id })
      .from(schema.pageComponents)
      .where(
        and(
          eq(schema.pageComponents.pageType, PAGE_TYPE),
          eq(schema.pageComponents.pageKey, PAGE_KEY),
          eq(schema.pageComponents.componentKey, comp.componentKey),
        ),
      )
      .limit(1);

    const values = {
      pageType: PAGE_TYPE,
      pageKey: PAGE_KEY,
      componentKey: comp.componentKey,
      componentType: comp.componentType,
      title: comp.title,
      section: comp.section,
      sortOrder: comp.sortOrder,
      componentProps: JSON.stringify(comp.componentProps),
      sourceName: comp.sourceName ?? SOURCE_NAME,
      sourceLink: comp.sourceLink ?? SOURCE_LINK,
      rankingLink: comp.rankingLink ?? null,
      dataSource: "ranking",
      gridColumnSpan: 12,
      isActive: true,
    };

    if (existing.length === 0) {
      await db.insert(schema.pageComponents).values(values);
      inserted++;
      console.log(`  ➕ inserted: ${comp.componentKey}`);
    } else {
      await db
        .update(schema.pageComponents)
        .set({
          componentType: values.componentType,
          title: values.title,
          section: values.section,
          sortOrder: values.sortOrder,
          componentProps: values.componentProps,
          sourceName: values.sourceName,
          sourceLink: values.sourceLink,
          rankingLink: values.rankingLink,
          dataSource: values.dataSource,
          gridColumnSpan: values.gridColumnSpan,
          isActive: values.isActive,
        })
        .where(
          and(
            eq(schema.pageComponents.pageType, PAGE_TYPE),
            eq(schema.pageComponents.pageKey, PAGE_KEY),
            eq(schema.pageComponents.componentKey, comp.componentKey),
          ),
        );
      updated++;
      console.log(`  🔄 updated:  ${comp.componentKey}`);
    }
  }

  console.log(
    `\n✅ ${PAGE_TYPE}|${PAGE_KEY}: total=${COMPONENTS.length} inserted=${inserted} updated=${updated}`,
  );
  sqlite.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
