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

// NextAuth型定義の拡張
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string;
      role: "admin" | "user";
    };
  }

  interface User {
    id: string;
    username?: string;
    role: "admin" | "user";
  }
}
