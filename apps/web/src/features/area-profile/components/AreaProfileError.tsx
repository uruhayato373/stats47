/**
 * 地域プロファイルエラーコンポーネント
 *
 * データ取得エラー時の表示
 */

import { AlertCircle } from "lucide-react";
import Link from "next/link";

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@stats47/components";

interface Props {
  title?: string;
  message?: string;
}

export function AreaProfileError({
  title = "エラーが発生しました",
  message = "地域データの取得中にエラーが発生しました。"
}: Props) {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {message}
          </p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/areas">
              地域選択に戻る
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              トップページへ
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
