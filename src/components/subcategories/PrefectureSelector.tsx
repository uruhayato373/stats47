"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { PrefectureService } from "@/lib/area";
import {
  CategoryData,
  SubcategoryData,
} from "@/types/visualization/choropleth";

interface PrefectureSelectorProps {
  category: CategoryData;
  subcategory: SubcategoryData;
}

export const PrefectureSelector: React.FC<PrefectureSelectorProps> = ({
  category,
  subcategory,
}) => {
  const router = useRouter();
  const params = useParams();
  const currentAreaCode = params.areaCode as string | undefined;

  const handlePrefectureChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedAreaCode = event.target.value;

    // 新しいURL構造: /dashboard/[areaCode]
    router.push(
      `/${category.id}/${subcategory.id}/dashboard/${selectedAreaCode}`
    );
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="prefecture-select"
        className="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap"
      >
        地域:
      </label>
      <select
        id="prefecture-select"
        value={currentAreaCode || "00000"}
        onChange={handlePrefectureChange}
        className="py-1.5 px-3 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
      >
        <option value="00000">全国</option>
        {PrefectureService.getAllPrefectures().map((pref) => (
          <option key={pref.prefCode} value={pref.prefCode}>
            {pref.prefName}
          </option>
        ))}
      </select>
    </div>
  );
};
