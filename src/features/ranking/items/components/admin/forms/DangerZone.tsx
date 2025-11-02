"use client";

import { useState } from "react";

import { Button } from "@/components/atoms/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/atoms/ui/dialog";

interface DangerZoneProps {
  rankingKey: string;
}

export function DangerZone({ rankingKey }: DangerZoneProps) {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/ranking-items/${rankingKey}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("削除に失敗しました");
      }

      // 削除成功後、一覧ページへリダイレクト
      window.location.href = "/admin/dev-tools/ranking-items";
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました");
      setOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-destructive">危険な操作</h3>
      <p className="text-sm text-muted-foreground">
        この操作は取り消せません。
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">ランキング項目を削除</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>本当に削除しますか？</DialogTitle>
            <DialogDescription>
              このランキング項目と関連するデータがすべて削除されます。
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

