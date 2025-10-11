"use client";

import React, { useState } from "react";
import { RankingItem } from "@/lib/ranking/get-ranking-items";

interface RankingItemFormProps {
  item?: RankingItem; // undefined = 新規作成モード
  onSubmit: (data: Partial<RankingItem>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RankingItemForm: React.FC<RankingItemFormProps> = ({
  item,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    rankingKey: item?.rankingKey || "",
    label: item?.label || "",
    statsDataId: item?.statsDataId || "",
    cdCat01: item?.cdCat01 || "",
    unit: item?.unit || "",
    name: item?.name || "",
    displayOrder: item?.displayOrder || 0,
    isActive: item?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.label) newErrors.label = "ラベルは必須です";
    if (!formData.statsDataId) newErrors.statsDataId = "統計データIDは必須です";
    if (!formData.cdCat01) newErrors.cdCat01 = "カテゴリコードは必須です";
    if (!formData.unit) newErrors.unit = "単位は必須です";
    if (!formData.name) newErrors.name = "名前は必須です";

    if (!item && !formData.rankingKey) {
      newErrors.rankingKey = "ランキングキーは必須です";
    }
    if (
      !item &&
      formData.rankingKey &&
      !/^[a-zA-Z0-9_-]+$/.test(formData.rankingKey)
    ) {
      newErrors.rankingKey =
        "ランキングキーは英数字、ハイフン、アンダースコアのみ使用できます";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">
        {item ? "ランキング項目を編集" : "新しいランキング項目を追加"}
      </h3>

      {!item && (
        <div>
          <label className="block text-sm font-medium mb-1">
            ランキングキー <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.rankingKey}
            onChange={(e) => handleChange("rankingKey", e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="totalAreaExcluding"
          />
          {errors.rankingKey && (
            <p className="text-red-500 text-sm mt-1">{errors.rankingKey}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            英数字、ハイフン、アンダースコアのみ。一意である必要があります。
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          ラベル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.label}
          onChange={(e) => handleChange("label", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="総面積（除く）"
        />
        {errors.label && (
          <p className="text-red-500 text-sm mt-1">{errors.label}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          統計データID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.statsDataId}
          onChange={(e) => handleChange("statsDataId", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="0000010102"
        />
        {errors.statsDataId && (
          <p className="text-red-500 text-sm mt-1">{errors.statsDataId}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          カテゴリコード <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.cdCat01}
          onChange={(e) => handleChange("cdCat01", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="B1101"
        />
        {errors.cdCat01 && (
          <p className="text-red-500 text-sm mt-1">{errors.cdCat01}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          単位 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.unit}
          onChange={(e) => handleChange("unit", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="ha"
        />
        {errors.unit && (
          <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          名前 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="総面積（北方地域及び竹島を除く）"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">表示順序</label>
        <input
          type="number"
          value={formData.displayOrder}
          onChange={(e) =>
            handleChange("displayOrder", parseInt(e.target.value))
          }
          className="w-full px-3 py-2 border rounded-md"
          min="0"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => handleChange("isActive", e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="isActive" className="text-sm font-medium">
          有効
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
          disabled={isLoading}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "処理中..." : item ? "保存" : "追加"}
        </button>
      </div>
    </form>
  );
};
