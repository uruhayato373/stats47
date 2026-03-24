export type DatabaseType = "static";

/**
 * テーブル情報の型定義
 */
export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey: boolean;
  default: unknown;
}

export interface TableInfo {
  name: string;
  schemaKey?: string;
  columns?: ColumnInfo[];
  count?: number;
}

/**
 * データベース情報の型定義
 */
export interface DatabaseInfo {
  tables: TableInfo[];
  totalTables: number;
  totalRecords: number;
  fetchedAt: string;
}
