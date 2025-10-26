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
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "admin" | "user";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username: string;
    role: "admin" | "user";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    username: string;
    role: "admin" | "user";
  }
}
