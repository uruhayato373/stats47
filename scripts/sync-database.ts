#!/usr/bin/env node

/**
 * ローカルD1データベースをリモートD1と同期するスクリプト
 * 作成日: 2025-01-13
 * 目的: 開発環境のデータを本番環境と一致させる
 */

import { execSync } from "child_process";
import fs from "fs";

interface DatabaseRecord {
  [key: string]: any;
}

class DatabaseSyncer {
  private databaseName = "stats47";

  /**
   * リモートD1からデータを取得
   */
  private async fetchRemoteData(tableName: string): Promise<DatabaseRecord[]> {
    try {
      const command = `npx wrangler d1 execute ${this.databaseName} --remote --command="SELECT * FROM ${tableName}"`;
      const output = execSync(command, { encoding: "utf-8" });

      // JSON出力をパース
      const lines = output.trim().split("\n");
      const jsonLine = lines.find((line) => line.startsWith("["));

      if (!jsonLine) {
        console.warn(`No data found for table ${tableName}`);
        return [];
      }

      const result = JSON.parse(jsonLine);
      return result.results || [];
    } catch (error) {
      console.error(`Failed to fetch data from ${tableName}:`, error);
      return [];
    }
  }

  /**
   * ローカルD1にデータを挿入
   */
  private async insertLocalData(
    tableName: string,
    records: DatabaseRecord[]
  ): Promise<void> {
    if (records.length === 0) {
      console.log(`No records to insert for ${tableName}`);
      return;
    }

    try {
      // テーブルをクリア
      const clearCommand = `npx wrangler d1 execute ${this.databaseName} --local --command="DELETE FROM ${tableName}"`;
      execSync(clearCommand, { stdio: "pipe" });

      // バッチでデータを挿入
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await this.insertBatch(tableName, batch);
      }

      console.log(`✅ Synced ${records.length} records to ${tableName}`);
    } catch (error) {
      console.error(`Failed to insert data into ${tableName}:`, error);
    }
  }

  /**
   * バッチでデータを挿入
   */
  private async insertBatch(
    tableName: string,
    records: DatabaseRecord[]
  ): Promise<void> {
    if (records.length === 0) return;

    const columns = Object.keys(records[0]);
    const values = records.map(
      (record) =>
        `(${columns
          .map((col) => {
            const value = record[col];
            if (value === null || value === undefined) return "NULL";
            if (typeof value === "string")
              return `'${value.replace(/'/g, "''")}'`;
            return value;
          })
          .join(", ")})`
    );

    const insertCommand = `INSERT INTO ${tableName} (${columns.join(
      ", "
    )}) VALUES ${values.join(", ")}`;

    try {
      execSync(
        `npx wrangler d1 execute ${this.databaseName} --local --command="${insertCommand}"`,
        { stdio: "pipe" }
      );
    } catch (error) {
      console.error(`Failed to insert batch into ${tableName}:`, error);
      // 個別に挿入を試行
      for (const record of records) {
        await this.insertSingleRecord(tableName, record);
      }
    }
  }

  /**
   * 単一レコードを挿入
   */
  private async insertSingleRecord(
    tableName: string,
    record: DatabaseRecord
  ): Promise<void> {
    const columns = Object.keys(record);
    const values = columns.map((col) => {
      const value = record[col];
      if (value === null || value === undefined) return "NULL";
      if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
      return value;
    });

    const insertCommand = `INSERT INTO ${tableName} (${columns.join(
      ", "
    )}) VALUES (${values.join(", ")})`;

    try {
      execSync(
        `npx wrangler d1 execute ${this.databaseName} --local --command="${insertCommand}"`,
        { stdio: "pipe" }
      );
    } catch (error) {
      console.error(`Failed to insert record into ${tableName}:`, error);
    }
  }

  /**
   * データベースを同期
   */
  async sync(): Promise<void> {
    console.log("🔄 Starting database synchronization...");

    const tables = [
      "subcategory_configs",
      "ranking_items",
      "data_source_metadata",
      "subcategory_ranking_items",
      "ranking_values",
    ];

    for (const table of tables) {
      console.log(`\n📊 Syncing ${table}...`);

      const records = await this.fetchRemoteData(table);
      await this.insertLocalData(table, records);
    }

    console.log("\n✅ Database synchronization completed!");
  }
}

// メイン実行
if (require.main === module) {
  const syncer = new DatabaseSyncer();
  syncer.sync().catch((error) => {
    console.error("❌ Synchronization failed:", error);
    process.exit(1);
  });
}

export { DatabaseSyncer };
