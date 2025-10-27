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
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
      role: "admin" | "user";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string;
    role: "admin" | "user";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string;
    role: "admin" | "user";
  }
}
