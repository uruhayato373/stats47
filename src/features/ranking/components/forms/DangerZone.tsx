"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/atoms/ui/alert-dialog";
import { Button } from "@/components/atoms/ui/button";

interface DangerZoneProps {
  itemId: number;
}

export function DangerZone({ itemId }: DangerZoneProps) {
  const handleDelete = () => {
    // TODO: 削除処理を実装
    console.log("削除:", itemId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-destructive">危険な操作</h3>
      <p className="text-sm text-muted-foreground">
        この操作は取り消せません。
      </p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">ランキング項目を削除</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              このランキング項目と関連するデータがすべて削除されます。
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

