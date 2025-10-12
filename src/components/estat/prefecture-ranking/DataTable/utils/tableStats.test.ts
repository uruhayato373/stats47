import { formatNumber, calculateStats, getRankBadgeClass } from "./tableStats";

describe("tableStats", () => {
  describe("formatNumber", () => {
    it("should format numbers with Japanese locale", () => {
      expect(formatNumber(1000)).toBe("1,000");
      expect(formatNumber(1234567)).toBe("1,234,567");
      expect(formatNumber(0)).toBe("0");
    });

    it("should handle negative numbers", () => {
      expect(formatNumber(-1000)).toBe("-1,000");
    });
  });

  describe("calculateStats", () => {
    const mockData = [
      {
        areaCode: "01",
        areaName: "北海道",
        numericValue: 1000,
        displayValue: "1,000",
        unit: "人",
        categoryCode: "A",
        timeCode: "2020",
        rank: 1,
      },
      {
        areaCode: "02",
        areaName: "青森県",
        numericValue: 500,
        displayValue: "500",
        unit: "人",
        categoryCode: "A",
        timeCode: "2020",
        rank: 2,
      },
      {
        areaCode: "03",
        areaName: "岩手県",
        numericValue: 750,
        displayValue: "750",
        unit: "人",
        categoryCode: "A",
        timeCode: "2020",
        rank: 3,
      },
    ];

    it("should calculate correct statistics", () => {
      const stats = calculateStats(mockData);

      expect(stats.count).toBe(3);
      expect(stats.max).toBe(1000);
      expect(stats.min).toBe(500);
      expect(stats.average).toBe(750);
    });

    it("should handle empty data", () => {
      const stats = calculateStats([]);

      expect(stats.count).toBe(0);
      expect(stats.max).toBeNull();
      expect(stats.min).toBeNull();
      expect(stats.average).toBeNull();
    });

    it("should handle single item", () => {
      const stats = calculateStats([mockData[0]]);

      expect(stats.count).toBe(1);
      expect(stats.max).toBe(1000);
      expect(stats.min).toBe(1000);
      expect(stats.average).toBe(1000);
    });

    it("should handle null values", () => {
      const dataWithNull = [
        ...mockData,
        {
          areaCode: "04",
          areaName: "宮城県",
          numericValue: null,
          displayValue: "-",
          unit: "人",
          categoryCode: "A",
          timeCode: "2020",
          rank: 4,
        },
      ];

      const stats = calculateStats(dataWithNull);

      expect(stats.count).toBe(4);
      expect(stats.max).toBe(1000);
      expect(stats.min).toBe(500);
      expect(stats.average).toBe(750);
    });
  });

  describe("getRankBadgeClass", () => {
    it("should return correct class for rank 1", () => {
      expect(getRankBadgeClass(1)).toBe("bg-yellow-100 text-yellow-800");
    });

    it("should return correct class for rank 2", () => {
      expect(getRankBadgeClass(2)).toBe("bg-gray-100 text-gray-800");
    });

    it("should return correct class for rank 3", () => {
      expect(getRankBadgeClass(3)).toBe("bg-orange-100 text-orange-800");
    });

    it("should return correct class for rank 4 and above", () => {
      expect(getRankBadgeClass(4)).toBe("bg-blue-100 text-blue-800");
      expect(getRankBadgeClass(10)).toBe("bg-blue-100 text-blue-800");
      expect(getRankBadgeClass(100)).toBe("bg-blue-100 text-blue-800");
    });

    it("should handle edge cases", () => {
      expect(getRankBadgeClass(0)).toBe("bg-blue-100 text-blue-800");
      expect(getRankBadgeClass(-1)).toBe("bg-blue-100 text-blue-800");
    });
  });
});
