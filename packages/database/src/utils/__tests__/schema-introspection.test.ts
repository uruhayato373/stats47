import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getSchemaTableInfo } from "../schema-introspection";

// Mock the entire 'drizzle-orm' module
vi.mock("drizzle-orm", async (importOriginal) => {
  const original = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...original,
    isTable: vi.fn(),
    getTableName: vi.fn(),
    getTableColumns: vi.fn(),
  };
});

// Mock the entire schema module
vi.mock("../../schema", () => ({
  users: "mock-users-table",
  posts: "mock-posts-table",
  someOtherExport: "not-a-table",
}));

// Mocks will be accessed via vi.mocked in tests
describe("Schema Introspection Utilities", () => {
    let isTable: any;
    let getTableName: any;
    let getTableColumns: any;

    beforeAll(async () => {
        const drizzle = await import("drizzle-orm");
        isTable = drizzle.isTable;
        getTableName = drizzle.getTableName;
        getTableColumns = drizzle.getTableColumns;
    });

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
  });

  describe("getSchemaTableInfo", () => {
    it("should correctly parse schema and return table information", () => {
      // --- Setup Mocks ---

      // 1. isTable mock: identify 'users' and 'posts' as tables
      vi.mocked(isTable).mockImplementation((value: any) => {
        return value === "mock-users-table" || value === "mock-posts-table";
      });

      // 2. getTableName mock: return table names
      vi.mocked(getTableName).mockImplementation((table: any) => {
        if (table === "mock-users-table") return "users_table";
        if (table === "mock-posts-table") return "posts_table";
        return "";
      });

      // 3. getTableColumns mock: return column info for each table
      vi.mocked(getTableColumns).mockImplementation((table: any) => {
        if (table === "mock-users-table") {
          return {
            id: {
              name: "id",
              dataType: "number",
              notNull: true,
              primary: true,
              default: undefined,
            },
            name: {
              name: "name",
              dataType: "string",
              notNull: true,
              primary: false,
              default: "Anonymous",
            },
          };
        }
        if (table === "mock-posts-table") {
          return {
            post_id: {
              name: "post_id",
              dataType: "string",
              notNull: true,
              primary: true,
              default: "uuid()",
            },
          };
        }
        return {} as any;
      });

      // --- Execute ---
      const tableInfo = getSchemaTableInfo();

      // --- Assert ---
      expect(tableInfo).toHaveLength(2);

      const usersTable = tableInfo.find((t) => t.name === "users_table");
      expect(usersTable).toBeDefined();
      expect(usersTable?.schemaKey).toBe("users");
      expect(usersTable?.columns).toHaveLength(2);
      expect(usersTable?.columns?.[0]).toEqual({
        name: "id",
        type: "number",
        notNull: true,
        primaryKey: true,
        default: undefined,
      });

      // name
      expect(usersTable?.columns?.[1]).toEqual({
        name: "name",
        type: "string",
        notNull: true,
        primaryKey: false,
        default: "Anonymous",
      });


      const postsTable = tableInfo.find((t) => t.name === "posts_table");
      expect(postsTable).toBeDefined();
      expect(postsTable?.columns).toHaveLength(1);
      expect(postsTable?.columns?.[0]).toEqual({
        name: "post_id",
        type: "string",
        notNull: true,
        primaryKey: true,
        default: "uuid()",
      });
    });

    it("should return an empty array if schema has no tables", () => {
      vi.mocked(isTable).mockReturnValue(false);
      const tableInfo = getSchemaTableInfo();
      expect(tableInfo).toEqual([]);
    });
  });
});
