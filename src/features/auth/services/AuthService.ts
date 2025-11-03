import "server-only";

import { runQuery } from "@/infrastructure/database";

import type { User } from "../types";

export class AuthService {
  static async login(
    email: string,
    passwordHash: string
  ): Promise<User | null> {
    // D1データベースからユーザーを取得
    const result = await runQuery(
      "SELECT * FROM users WHERE email = ? AND password_hash = ?",
      email,
      passwordHash
    );
    const user = result?.results?.[0];
    if (!user) return null;
    return user as User;
  }

  static async getCurrentUser(userId: string): Promise<User | null> {
    // D1データベースからユーザーを取得
    const result = await runQuery("SELECT * FROM users WHERE id = ?", userId);
    return result?.results?.[0] || null;
  }

  static async getUserByEmail(
    email: string
  ): Promise<(User & { passwordHash?: string }) | null> {
    // D1データベースからユーザーを取得（パスワードハッシュも含む）
    const result = await runQuery("SELECT * FROM users WHERE email = ?", email);
    const user = result?.results?.[0] as
      | (User & { password_hash?: string })
      | undefined;
    if (!user) return null;
    // password_hash を passwordHash に変換
    return {
      ...user,
      passwordHash: user.password_hash,
    };
  }

  static checkPermission(user: User | null, role: "admin" | "user"): boolean {
    if (!user) return false;
    if (role === "admin" && user.role !== "admin") return false;
    return true;
  }
}
