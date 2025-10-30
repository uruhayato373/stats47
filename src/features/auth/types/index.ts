export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface UserStats {
  totalUsers: number;
  adminCount: number;
  activeUsers: number;
}

// NextAuth型定義の拡張は src/types/next-auth.d.ts に移動しました
