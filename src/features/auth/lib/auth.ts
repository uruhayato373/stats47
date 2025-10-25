import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { getDataProvider } from "@/lib/database";

import type { NextAuthConfig } from "next-auth";

// TypeScript型定義の拡張
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
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string;
    role: "admin" | "user";
  }
}

// NextAuth設定
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [
    // Credentials Provider（メール + パスワード）
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const db = await getDataProvider();

          // ユーザーを検索
          const user = await db
            .prepare("SELECT * FROM users WHERE email = ?")
            .bind(credentials.email)
            .first();

          if (!user) {
            return null;
          }

          // パスワードを検証
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password_hash as string
          );

          if (!isValidPassword) {
            return null;
          }

          // アクティブユーザーのみ許可
          if (!user.is_active) {
            return null;
          }

          // 最終ログイン日時を更新
          await db
            .prepare(
              "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?"
            )
            .bind(user.id)
            .run();

          return {
            id: user.id as string,
            name: user.name as string,
            email: user.email as string,
            username: user.username as string,
            role: user.role as "admin" | "user",
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      // セッションにユーザー情報を追加
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as "admin" | "user";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username || "";
        token.role = user.role || "user";
      }
      return token;
    },
  },

  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
    updateAge: 24 * 60 * 60, // 24時間ごとに更新
  },

  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  debug: process.env.NODE_ENV === "development",
};

// NextAuthインスタンスの作成とエクスポート
export const { handlers, auth: nextAuthAuth, signIn: nextAuthSignIn, signOut: nextAuthSignOut } = NextAuth(authConfig);

// Mock環境対応のauth関数（Server Components用）
export const auth = async () => {
  const isMockEnv = process.env.NEXT_PUBLIC_USE_MOCK === "true";

  // Mock環境ではモックセッションを返す
  if (isMockEnv && process.env.NODE_ENV !== "production") {
    return {
      user: {
        id: "mock-admin",
        name: "モック管理者",
        email: "admin@example.com",
        username: "admin",
        role: "admin" as const,
      },
    };
  }

  // API環境・本番環境では通常の認証処理
  return await nextAuthAuth();
};

// Mock環境でも動作するsignIn/signOut
export const signIn = async (...args: Parameters<typeof nextAuthSignIn>) => {
  const isMockEnv = process.env.NEXT_PUBLIC_USE_MOCK === "true";

  if (isMockEnv && process.env.NODE_ENV !== "production") {
    // Mock環境では何もしない
    return;
  }

  return await nextAuthSignIn(...args);
};

export const signOut = async (...args: Parameters<typeof nextAuthSignOut>) => {
  const isMockEnv = process.env.NEXT_PUBLIC_USE_MOCK === "true";

  if (isMockEnv && process.env.NODE_ENV !== "production") {
    // Mock環境では何もしない
    return;
  }

  return await nextAuthSignOut(...args);
};

// ミドルウェア用のauth（NextAuthネイティブの関数を使用）
export const authMiddleware = nextAuthAuth;
