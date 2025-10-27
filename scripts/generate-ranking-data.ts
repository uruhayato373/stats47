/**
 * mapping.csvからランキング項目とグループを生成するスクリプト
 *
 * 使用方法:
 * npx tsx scripts/generate-ranking-data.ts
 */

import fs from "fs";
import path from "path";

interface MappingRow {
  stats_data_id: string;
  cat01: string;
  item_name: string;
  item_code: string;
  unit: string;
  dividing_value: string;
  new_unit: string;
  ascending: string;
}

interface RankingItem {
  rankingKey: string;
  label: string;
  name: string;
  description: string;
  unit: string;
  dataSourceId: string;
  statsDataId: string;
  cat01: string;
  rankingDirection: "asc" | "desc";
  conversionFactor?: number;
  decimalPlaces?: number;
}

interface RankingGroup {
  groupKey: string;
  subcategoryId: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  items: RankingItem[];
}

interface GroupingRule {
  subcategoryId: string;
  categoryId: string;
  groups: {
    pattern: RegExp;
    name: string;
    description: string;
    icon: string;
  }[];
}

// グループ化ルール定義
const groupingRules: Record<string, GroupingRule> = {
  "0000010204": {
    subcategoryId: "prefecture-finance",
    categoryId: "economy",
    groups: [
      {
        pattern: /(財政力|収支|健全)/,
        name: "財政健全性指標",
        description: "財政の健全性を示す指標",
        icon: "📊",
      },
      {
        pattern: /(自主財源|地方税|地方交付税|国庫)/,
        name: "歳入構成",
        description: "財政収入の構成要素",
        icon: "💰",
      },
      {
        pattern: /(民生費|教育費|土木費|警察費|消防費|衛生費|労働費|農林|商工)/,
        name: "歳出構成（目的別）",
        description: "目的別の歳出構成",
        icon: "🏛️",
      },
      {
        pattern: /(人件費|扶助費|建設事業費|投資的)/,
        name: "歳出構成（性質別）",
        description: "性質別の歳出構成",
        icon: "📋",
      },
      {
        pattern: /(人口1人当たり|住民税|固定資産税)/,
        name: "1人当たり指標",
        description: "人口1人当たりの財政指標",
        icon: "👤",
      },
    ],
  },
  "0000010210": {
    subcategoryId: "social-welfare",
    categoryId: "welfare",
    groups: [
      {
        pattern: /(生活保護|被保護)/,
        name: "生活保護",
        description: "生活保護に関する指標",
        icon: "🤝",
      },
      {
        pattern: /(老人|高齢者|65歳以上)/,
        name: "高齢者福祉",
        description: "高齢者福祉に関する指標",
        icon: "👴",
      },
      {
        pattern: /(児童|子ども|17歳以下)/,
        name: "児童福祉",
        description: "児童福祉に関する指標",
        icon: "👶",
      },
      {
        pattern: /(障害者|身体障害|知的障害)/,
        name: "障害者福祉",
        description: "障害者福祉に関する指標",
        icon: "♿",
      },
      {
        pattern: /(施設数|センター数)/,
        name: "福祉施設",
        description: "福祉施設に関する指標",
        icon: "🏥",
      },
    ],
  },
  "0000010211": {
    subcategoryId: "public-safety",
    categoryId: "safety",
    groups: [
      {
        pattern: /(消防|火災)/,
        name: "消防・火災",
        description: "消防と火災に関する指標",
        icon: "🚒",
      },
      {
        pattern: /(交通事故|道路交通)/,
        name: "交通事故",
        description: "交通事故に関する指標",
        icon: "🚗",
      },
      {
        pattern: /(警察|刑法犯|犯罪)/,
        name: "治安・犯罪",
        description: "治安と犯罪に関する指標",
        icon: "👮",
      },
      {
        pattern: /(保険)/,
        name: "保険",
        description: "保険に関する指標",
        icon: "🛡️",
      },
    ],
  },
  "0000010205": {
    subcategoryId: "education",
    categoryId: "education",
    groups: [
      {
        pattern: /(小学校)/,
        name: "小学校",
        description: "小学校に関する指標",
        icon: "🏫",
      },
      {
        pattern: /(中学校)/,
        name: "中学校",
        description: "中学校に関する指標",
        icon: "🎓",
      },
      {
        pattern: /(高等学校|高校)/,
        name: "高等学校",
        description: "高等学校に関する指標",
        icon: "📚",
      },
      {
        pattern: /(幼稚園)/,
        name: "幼稚園",
        description: "幼稚園に関する指標",
        icon: "🧸",
      },
      {
        pattern: /(保育所|こども園)/,
        name: "保育施設",
        description: "保育施設に関する指標",
        icon: "👶",
      },
      {
        pattern: /(大学|短期大学)/,
        name: "高等教育",
        description: "高等教育に関する指標",
        icon: "🎓",
      },
      {
        pattern: /(専修学校|各種学校)/,
        name: "その他教育機関",
        description: "その他の教育機関",
        icon: "📖",
      },
    ],
  },
};

/**
 * CSVファイルを読み込む
 */
function readCsvFile(filePath: string): MappingRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const headers = lines[0].split(",");

  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(",");
      return {
        stats_data_id: values[0],
        cat01: values[1],
        item_name: values[2],
        item_code: values[3],
        unit: values[4],
        dividing_value: values[5] || "",
        new_unit: values[6] || "",
        ascending: values[7] || "False",
      };
    })
    .filter((row) => row.stats_data_id && row.item_name);
}

/**
 * グループにアイテムを分類
 */
function groupItems(mappingRows: MappingRow[]): RankingGroup[] {
  const groupsByStatsId = new Map<string, RankingGroup[]>();

  // stats_data_idごとにグループ化
  for (const row of mappingRows) {
    const rule = groupingRules[row.stats_data_id];
    if (!rule) continue;

    if (!groupsByStatsId.has(row.stats_data_id)) {
      groupsByStatsId.set(row.stats_data_id, []);
    }

    const groups = groupsByStatsId.get(row.stats_data_id)!;

    // どのグループに属するか判定
    let matched = false;
    for (let i = 0; i < rule.groups.length; i++) {
      const groupRule = rule.groups[i];
      if (groupRule.pattern.test(row.item_name)) {
        // 既存のグループを探す
        let group = groups.find(
          (g) => g.groupKey === `${rule.subcategoryId}-${i}`
        );

        if (!group) {
          group = {
            groupKey: `${rule.subcategoryId}-${i}`,
            subcategoryId: rule.subcategoryId,
            name: groupRule.name,
            description: groupRule.description,
            icon: groupRule.icon,
            displayOrder: i,
            items: [],
          };
          groups.push(group);
        }

        // ランキングアイテムを作成
        const item: RankingItem = {
          rankingKey: row.item_code,
          label: row.item_name,
          name: row.item_name,
          description: row.item_name,
          unit: row.new_unit || row.unit,
          dataSourceId: "estat",
          statsDataId: row.stats_data_id,
          cat01: row.cat01,
          rankingDirection: row.ascending === "True" ? "asc" : "desc",
          conversionFactor: row.dividing_value
            ? parseFloat(row.dividing_value)
            : undefined,
          decimalPlaces: row.new_unit ? 2 : 0,
        };

        group.items.push(item);
        matched = true;
        break;
      }
    }

    // どのグループにもマッチしない場合は「その他」グループに追加
    if (!matched) {
      let group = groups.find(
        (g) => g.groupKey === `${rule.subcategoryId}-other`
      );
      if (!group) {
        group = {
          groupKey: `${rule.subcategoryId}-other`,
          subcategoryId: rule.subcategoryId,
          name: "その他",
          description: "その他の指標",
          icon: "📄",
          displayOrder: 999,
          items: [],
        };
        groups.push(group);
      }

      const item: RankingItem = {
        rankingKey: row.item_code,
        label: row.item_name,
        name: row.item_name,
        description: row.item_name,
        unit: row.new_unit || row.unit,
        dataSourceId: "estat",
        statsDataId: row.stats_data_id,
        cat01: row.cat01,
        rankingDirection: row.ascending === "True" ? "asc" : "desc",
      };

      group.items.push(item);
    }
  }

  // 全てのグループを配列にフラット化
  const allGroups: RankingGroup[] = [];
  for (const [_, groups] of groupsByStatsId) {
    allGroups.push(...groups);
  }

  return allGroups;
}

/**
 * SQLを生成
 */
function generateSQL(groups: RankingGroup[]): string {
  let sql = "-- ランキングデータ生成SQL\n";
  sql +=
    "-- このファイルは scripts/generate-ranking-data.ts から自動生成されました\n\n";

  // サブカテゴリのINSERT文
  const subcategories = new Set<string>();
  for (const group of groups) {
    if (!subcategories.has(group.subcategoryId)) {
      subcategories.add(group.subcategoryId);
      sql += `INSERT OR IGNORE INTO subcategory_configs (id, category_id, name, description)\n`;
      sql += `VALUES ('${group.subcategoryId}', 'placeholder', 'Placeholder', 'Generated');\n`;
    }
  }

  sql += "\n";

  // ランキングアイテムのINSERT文
  sql += "-- Ranking Items\n";
  let itemId = 1;
  const itemsMap = new Map<string, number>();

  for (const group of groups) {
    for (const item of group.items) {
      if (!itemsMap.has(item.rankingKey)) {
        itemsMap.set(item.rankingKey, itemId);
        sql += `INSERT OR IGNORE INTO ranking_items (\n`;
        sql += `  id, ranking_key, label, name, description, unit, data_source_id,\n`;
        sql += `  ranking_direction, conversion_factor, decimal_places, is_active\n`;
        sql += `) VALUES (\n`;
        sql += `  ${itemId}, '${item.rankingKey}', '${item.label}', '${item.name}', '${item.description}', '${item.unit}', '${item.dataSourceId}',\n`;
        sql += `  '${item.rankingDirection}', ${item.conversionFactor || 1}, ${
          item.decimalPlaces || 0
        }, 1\n`;
        sql += `);\n\n`;

        // データソースメタデータ
        sql += `INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)\n`;
        sql += `VALUES (${itemId}, 'estat', '{"stats_data_id": "${item.statsDataId}", "cd_cat01": "${item.cat01}"}');\n\n`;

        itemId++;
      }
    }
  }

  sql += "\n";

  // ランキンググループのINSERT文
  sql += "-- Ranking Groups\n";
  let groupId = 1;
  const groupsMap = new Map<string, number>();

  for (const group of groups) {
    if (!groupsMap.has(group.groupKey)) {
      groupsMap.set(group.groupKey, groupId);
      sql += `INSERT OR IGNORE INTO ranking_groups (\n`;
      sql += `  id, group_key, subcategory_id, name, description, icon, display_order\n`;
      sql += `) VALUES (\n`;
      sql += `  ${groupId}, '${group.groupKey}', '${group.subcategoryId}', '${group.name}', '${group.description}', '${group.icon}', ${group.displayOrder}\n`;
      sql += `);\n\n`;

      groupId++;
    }
  }

  sql += "\n";

  // ランキンググループアイテムのINSERT文
  sql += "-- Ranking Group Items\n";
  let groupItemOrder = 1;

  for (const group of groups) {
    const currentGroupId = groupsMap.get(group.groupKey);
    if (!currentGroupId) continue;

    for (const item of group.items) {
      const currentItemId = itemsMap.get(item.rankingKey);
      if (!currentItemId) continue;

      sql += `INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)\n`;
      sql += `VALUES (${currentGroupId}, ${currentItemId}, ${groupItemOrder}, 0);\n\n`;

      groupItemOrder++;
    }
    groupItemOrder = 1;
  }

  return sql;
}

/**
 * メイン処理
 */
function main() {
  console.log("📊 Ranking data generation started...");

  // CSVファイルを読み込む
  const csvPath = path.join(process.cwd(), "data", "mapping.csv");
  const mappingRows = readCsvFile(csvPath);

  console.log(`📋 Loaded ${mappingRows.length} mapping rows`);

  // アイテムをグループ化
  const groups = groupItems(mappingRows);

  console.log(`🎯 Generated ${groups.length} ranking groups`);

  // SQLを生成
  const sql = generateSQL(groups);

  // SQLファイルに出力
  const outputPath = path.join(
    process.cwd(),
    "database",
    "migrations",
    "021_populate_ranking_data_from_mapping.sql"
  );
  fs.writeFileSync(outputPath, sql, "utf-8");

  console.log(`✅ SQL file generated: ${outputPath}`);
  console.log(`📝 Total groups: ${groups.length}`);
  console.log(
    `📦 Total items: ${groups.reduce((sum, g) => sum + g.items.length, 0)}`
  );
}

// スクリプト実行
if (require.main === module) {
  main();
}

export { generateSQL, groupItems, readCsvFile };
