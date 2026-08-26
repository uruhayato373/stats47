import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { ensureDisposableGisCatalog } from "../disposable-catalog-db";

describe("ensureDisposableGisCatalog", () => {
  let db: Database.Database | undefined;

  afterEach(() => db?.close());

  it("creates the current GIS catalog schema in an empty disposable DB", () => {
    db = new Database(":memory:");

    ensureDisposableGisCatalog(db);

    const columns = db
      .prepare("PRAGMA table_info(gis_datasets)")
      .all() as Array<{ name: string }>;
    expect(columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        "data_id",
        "status",
        "latest_version",
        "is_ranking_target",
        "ranking_config",
      ]),
    );
    expect(
      db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all(),
    ).toEqual(
      expect.arrayContaining([
        { name: "idx_gis_datasets_status" },
        { name: "idx_gis_datasets_ranking_target" },
      ]),
    );
  });

  it("is idempotent", () => {
    db = new Database(":memory:");

    ensureDisposableGisCatalog(db);
    ensureDisposableGisCatalog(db);

    expect(
      db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE name='gis_datasets'").get(),
    ).toEqual({ count: 1 });
  });
});
