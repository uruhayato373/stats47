"use server";

import usersData from "@data/mock/auth/users.json";
import { revalidatePath } from "next/cache";
import type { User } from "../types";

/**
 * ユーザー状態切り替え（Server Action）
 */
export async function toggleUserStatusAction(
  userId: string,
  currentStatus: boolean
) {
  try {
    // モック実装：実際のデータベース更新の代わりにログ出力
    console.log(
      `ユーザー ${userId} の状態を ${currentStatus} から ${!currentStatus} に変更`
    );

    // ページを再検証（キャッシュ無効化）
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("ユーザー状態更新エラー:", error);
    return {
      success: false,
      error: "ユーザー状態の更新に失敗しました",
    };
  }
}

/**
 * ユーザー一覧取得（サーバーサイド）
 */
export async function fetchUsers(): Promise<User[]> {
  try {
    // モックデータを使用
    return usersData as User[];
  } catch (error) {
    console.error("ユーザー取得エラー:", error);
    return [];
  }
}
