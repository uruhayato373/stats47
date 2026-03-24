// Vitest setup file
import { vi } from "vitest";

// Mock server-only globally
vi.mock("server-only", () => ({}));
