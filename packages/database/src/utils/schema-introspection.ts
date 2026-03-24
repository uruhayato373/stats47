import { getTableColumns, getTableName, isTable } from "drizzle-orm";
import * as schema from "../schema";

import { type TableInfo } from "../types/stats";

/**
 * Drizzleスキーマからテーブル情報を取得
 */
export function getSchemaTableInfo(): TableInfo[] {
  return Object.entries(schema)
    .filter(([_, value]) => isTable(value))
    .map(([key, table]) => {
      // isTable check ensures table has correct type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tableName = getTableName(table as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const columns = getTableColumns(table as any);

      return {
        name: tableName,
        schemaKey: key,
        columns: Object.entries(columns).map(([colName, colAny]) => {
          const col = colAny as any;
          return {
            name: colName,
            type: col.dataType,
            notNull: col.notNull,
            primaryKey: col.primary,
            default: typeof col.default === "object" && col.default !== null
              ? String(col.default)
              : col.default,
          };
        }),
      };
    });
}
