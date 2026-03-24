import { describe, expect, it } from "vitest";
import { computeDescriptiveStats } from "../compute-descriptive-stats";
describe("computeDescriptiveStats", () => {
    it("should return null for empty array", () => {
        expect(computeDescriptiveStats([])).toBeNull();
    });
    it("should calculate correct stats for a simple array", () => {
        // 1, 2, 3, 4, 5
        // sum: 15
        // mean: 3
        // median: 3
        // max: 5
        // min: 1
        // variance: 2 ( (4+1+0+1+4)/5 = 10/5 = 2 )
        // stdDev: sqrt(2) approx 1.4142...
        // cv: 1.4142... / 3 * 100 approx 47.14...
        const data = [1, 2, 3, 4, 5];
        const result = computeDescriptiveStats(data);
        expect(result).not.toBeNull();
        expect(result === null || result === void 0 ? void 0 : result.sum).toBe(15);
        expect(result === null || result === void 0 ? void 0 : result.mean).toBe(3);
        expect(result === null || result === void 0 ? void 0 : result.median).toBe(3);
        expect(result === null || result === void 0 ? void 0 : result.max).toBe(5);
        expect(result === null || result === void 0 ? void 0 : result.min).toBe(1);
        expect(result === null || result === void 0 ? void 0 : result.variance).toBe(2);
        expect(result === null || result === void 0 ? void 0 : result.standardDeviation).toBeCloseTo(1.4142, 4);
        expect(result === null || result === void 0 ? void 0 : result.coefficientOfVariation).toBeCloseTo(47.1404, 4);
        expect(result === null || result === void 0 ? void 0 : result.count).toBe(5);
    });
    it("should calculate correct median for even number of elements", () => {
        // 1, 2, 3, 4
        // median: (2+3)/2 = 2.5
        const data = [1, 2, 3, 4];
        const result = computeDescriptiveStats(data);
        expect(result === null || result === void 0 ? void 0 : result.median).toBe(2.5);
    });
    it("should handle single element array", () => {
        const data = [10];
        const result = computeDescriptiveStats(data);
        expect(result === null || result === void 0 ? void 0 : result.sum).toBe(10);
        expect(result === null || result === void 0 ? void 0 : result.mean).toBe(10);
        expect(result === null || result === void 0 ? void 0 : result.median).toBe(10);
        expect(result === null || result === void 0 ? void 0 : result.max).toBe(10);
        expect(result === null || result === void 0 ? void 0 : result.min).toBe(10);
        expect(result === null || result === void 0 ? void 0 : result.standardDeviation).toBe(0);
        expect(result === null || result === void 0 ? void 0 : result.coefficientOfVariation).toBe(0);
    });
    it("should handle array with identical values", () => {
        const data = [5, 5, 5];
        const result = computeDescriptiveStats(data);
        expect(result === null || result === void 0 ? void 0 : result.mean).toBe(5);
        expect(result === null || result === void 0 ? void 0 : result.standardDeviation).toBe(0);
        expect(result === null || result === void 0 ? void 0 : result.coefficientOfVariation).toBe(0);
    });
    it("should handle negative values", () => {
        // -2, 0, 2
        // mean: 0
        // stdDev: sqrt((4+0+4)/3) = sqrt(8/3) approx 1.633...
        // cv: 0 (mean is 0)
        const data = [-2, 0, 2];
        const result = computeDescriptiveStats(data);
        expect(result === null || result === void 0 ? void 0 : result.mean).toBe(0);
        expect(result === null || result === void 0 ? void 0 : result.median).toBe(0);
        expect(result === null || result === void 0 ? void 0 : result.coefficientOfVariation).toBe(0); // mean is 0
    });
    it("should handle negative mean for CV calculation", () => {
        // -5, -5, -5
        // mean: -5
        // stdDev: 0
        // cv: 0
        const data = [-5, -5, -5];
        const result = computeDescriptiveStats(data);
        expect(result === null || result === void 0 ? void 0 : result.mean).toBe(-5);
        expect(result === null || result === void 0 ? void 0 : result.coefficientOfVariation).toBe(0);
    });
});
