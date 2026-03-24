import { describe, expect, it } from "vitest";
import { extractD1Error, extractD1QueryError } from "../error-handler";

describe("Error Handler Utilities", () => {
  describe("extractD1Error", () => {
    it("should return the error if it is an instance of Error", () => {
      const error = new Error("Test Error");
      expect(extractD1Error(error)).toBe(error);
    });

    it("should create a new Error from a string", () => {
      const errorString = "This is an error string";
      const result = extractD1Error(errorString);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe(errorString);
    });

    it("should create a new Error from null", () => {
      const result = extractD1Error(null);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("null");
    });

    it("should create a new Error from undefined", () => {
      const result = extractD1Error(undefined);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("undefined");
    });

    it("should create a new Error from an object", () => {
      const errorObject = { code: "UNKNOWN", details: "Some details" };
      const result = extractD1Error(errorObject);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("[object Object]");
    });
  });

  describe("extractD1QueryError", () => {
    const defaultMsg = "データベースクエリの実行に失敗しました";

    it("should return the original error and message if it is an instance of Error", () => {
      const error = new Error("Specific DB Error");
      const { error: errorObj, message } = extractD1QueryError(error);
      expect(errorObj).toBe(error);
      expect(message).toBe("Specific DB Error");
    });

    it("should return a new error with the default message for null input", () => {
      const { error: errorObj, message } = extractD1QueryError(null);
      expect(errorObj).toBeInstanceOf(Error);
      expect(errorObj.message).toBe(defaultMsg);
      expect(message).toBe(defaultMsg);
    });

    it("should return a new error with the default message for undefined input", () => {
      const { error: errorObj, message } = extractD1QueryError(undefined);
      expect(errorObj).toBeInstanceOf(Error);
      expect(errorObj.message).toBe(defaultMsg);
      expect(message).toBe(defaultMsg);
    });

    it("should use a custom default message if provided", () => {
      const customMsg = "Custom error message";
      const { error: errorObj, message } = extractD1QueryError(null, customMsg);
      expect(errorObj).toBeInstanceOf(Error);
      expect(errorObj.message).toBe(customMsg);
      expect(message).toBe(customMsg);
    });

    it("should create an error from a string input and return its message", () => {
      const errorString = "String error from DB";
      const { error: errorObj, message } = extractD1QueryError(errorString);
      expect(errorObj).toBeInstanceOf(Error);
      expect(errorObj.message).toBe(errorString);
      expect(message).toBe(errorString);
    });
  });
});
