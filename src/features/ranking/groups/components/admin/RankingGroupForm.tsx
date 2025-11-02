import Link from "next/link";

import { Button } from "@/components/atoms/ui/button";
import { Input } from "@/components/atoms/ui/input";
import { Label } from "@/components/atoms/ui/label";

import type { Subcategory } from "@/features/category";
import type { RankingGroup } from "@/features/ranking/groups/types";

interface RankingGroupFormProps {
  group?: RankingGroup;
  subcategories: Subcategory[];
}

export function RankingGroupForm({
  group,
  subcategories,
}: RankingGroupFormProps) {
  return (
    <form
      action={
        group
          ? `/api/admin/ranking-groups/${group.id}`
          : "/api/admin/ranking-groups/new"
      }
      method="POST"
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="groupKey">グループキー</Label>
        <Input
          id="groupKey"
          name="groupKey"
          defaultValue={group?.groupKey}
          placeholder="population-total-group"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subcategoryId">サブカテゴリ</Label>
        <select
          id="subcategoryId"
          name="subcategoryId"
          defaultValue={group?.subcategoryId}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        >
          <option value="">選択してください</option>
          {subcategories.map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">グループ名</Label>
        <Input
          id="name"
          name="name"
          defaultValue={group?.name}
          placeholder="総人口グループ"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">アイコン（絵文字またはテキスト）</Label>
        <Input
          id="icon"
          name="icon"
          defaultValue={group?.icon}
          placeholder="🔧"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayOrder">表示順</Label>
        <Input
          id="displayOrder"
          name="displayOrder"
          type="number"
          defaultValue={group?.displayOrder}
          placeholder="0"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Link href="/admin/dev-tools/ranking-groups">
          <Button type="button" variant="outline">
            キャンセル
          </Button>
        </Link>
        <Button type="submit">{group ? "更新" : "作成"}</Button>
      </div>
    </form>
  );
}
