"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { PrefectureService } from "../../services/prefecture-service";

/**
 * 都道府県選択コンポーネント
 *
 * 機能:
 * - 都道府県の選択UI提供
 * - 選択時にダッシュボードページへ遷移
 * - URLパラメータから現在の選択を取得
 *
 * URL構造: /[category]/[subcategory]/dashboard/[areaCode]
 * 例: /population/basic-population/dashboard/13000
 */
export const PrefectureSelector: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [prefectures, setPrefectures] = useState<
    Array<{ prefCode: string; prefName: string }>
  >([]);

  // URLパラメータから取得
  const category = params.category as string;
  const subcategory = params.subcategory as string;
  const currentAreaCode = params.areaCode as string | undefined;

  // 都道府県データを取得
  useEffect(() => {
    const fetchPrefectures = async () => {
      try {
        const data = await PrefectureService.listPrefectures();
        setPrefectures(data);
      } catch (error) {
        console.error("Failed to fetch prefectures:", error);
      }
    };
    fetchPrefectures();
  }, []);

  const handlePrefectureChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedAreaCode = event.target.value;

    // ダッシュボードページへ遷移
    router.push(`/${category}/${subcategory}/dashboard/${selectedAreaCode}`);
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
        className="py-1.5 px-3 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-ring disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
      >
        <option value="00000">全国</option>
        {prefectures.map((pref) => (
          <option key={pref.prefCode} value={pref.prefCode}>
            {pref.prefName}
          </option>
        ))}
      </select>
    </div>
  );
};
