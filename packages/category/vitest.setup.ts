import { vi } from "vitest";

// "server-only" をグローバルにモックして、
// すべてのテストファイルで "This module cannot be imported from a Client Component module" エラーを回避する
vi.mock("server-only", () => ({}));
