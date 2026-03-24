import { describe, expect, it } from "vitest";
import { err, isErr, isOk, ok, unwrap } from "../result";

describe("Result utility functions", () => {
  describe("ok", () => {
    it("should create a successful Result object", () => {
      const result = ok("successData");
      expect(result.success).toBe(true);
      expect((result as any).data).toBe("successData");
    });
  });

  describe("err", () => {
    it("should create an error Result object", () => {
      const error = new Error("errorMessage");
      const result = err(error);
      expect(result.success).toBe(false);
      expect((result as any).error).toBe(error);
    });
  });

  describe("isOk", () => {
    it("should return true for a successful Result", () => {
      const result = ok("data");
      expect(isOk(result)).toBe(true);
    });

    it("should return false for an error Result", () => {
      const result = err(new Error("error"));
      expect(isOk(result)).toBe(false);
    });
  });

  describe("isErr", () => {
    it("should return true for an error Result", () => {
      const result = err(new Error("error"));
      expect(isErr(result)).toBe(true);
    });

    it("should return false for a successful Result", () => {
      const result = ok("data");
      expect(isErr(result)).toBe(false);
    });
  });

  describe("unwrap", () => {
    it("should return the data for a successful Result", () => {
      const result = ok("data");
      expect(unwrap(result)).toBe("data");
    });

    it("should throw the error for an error Result", () => {
      const error = new Error("unwrap error");
      const result = err(error);
      expect(() => unwrap(result)).toThrow(error);
    });
  });
});
