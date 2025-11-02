import "server-only";

import type { User } from '../types';
import { runQuery } from "@/infrastructure/database";

export class AuthService {
  static async login(email: string, passwordHash: string): Promise<User | null> {
    // D1データベースからユーザーを取得
    const result = await runQuery('SELECT * FROM users WHERE email = ? AND password_hash = ?', email, passwordHash);
    const user = result?.results?.[0];
    if (!user) return null;
    return user as User;
  }

  static async getCurrentUser(userId: string): Promise<User | null> {
    // D1データベースからユーザーを取得
    const result = await runQuery('SELECT * FROM users WHERE id = ?', userId);
    return result?.results?.[0] || null;
  }

  static checkPermission(user: User | null, role: 'admin' | 'user'): boolean {
    if (!user) return false;
    if (role === 'admin' && user.role !== 'admin') return false;
    return true;
  }
}
