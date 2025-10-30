import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { AuthService } from "../services/AuthService";

import type { NextAuthConfig, Session, User } from "../types";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        // パスワードハッシュ化
        const passwordHash = await bcrypt.hash(credentials.password, 10);
        
        // D1データベースからユーザーを取得
        const user = await AuthService.login(credentials.email, passwordHash);
        if (!user || !user.is_active) return null;
        
        // パスワード検証（D1: hash保存）
        if (!(await bcrypt.compare(credentials.password, user.passwordHash))) {
          return null;
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
    updateAge: 24 * 60 * 60, // 24h
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
  callbacks: {
    async session({ session, token }) {
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
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
};

export const {
  handlers,
  auth: nextAuthAuth,
  signIn: nextAuthSignIn,
  signOut: nextAuthSignOut,
} = NextAuth(authConfig);

export const signIn = nextAuthSignIn;
export const signOut = nextAuthSignOut;
export const auth = nextAuthAuth;
