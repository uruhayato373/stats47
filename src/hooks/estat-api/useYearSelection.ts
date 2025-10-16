"use client";

import { useState, useEffect } from "react";
import { FormattedEstatData } from "@/lib/estat-api";

interface UseYearSelectionOptions {
  years: FormattedEstatData["years"];
}

export function useYearSelection({ years }: UseYearSelectionOptions) {
  const [selectedYear, setSelectedYear] = useState<string>("");

  // 年次が変更されたときに最初の年度を選択
  useEffect(() => {
    if (years && years.length > 0) {
      const sortedYears = [...years].sort(
        (a, b) => parseInt(b.timeCode) - parseInt(a.timeCode)
      );
      setSelectedYear(sortedYears[0].timeCode);
    } else {
      setSelectedYear("");
    }
  }, [years]);

  return {
    selectedYear,
    setSelectedYear,
  };
}
