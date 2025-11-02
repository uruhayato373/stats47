/**
 * NextAuth型定義の拡張
 *
 * NextAuth.jsのデフォルト型定義を拡張し、
 * アプリケーション固有のユーザー情報（id、username、role）を追加する。
 *
 * @module types/next-auth
 */

import type { DefaultSession } from "next-auth";

/**
 * NextAuth Session型の拡張
 */
declare module "next-auth" {
  /**
   * セッションオブジェクトの型定義
   *
   * デフォルトのSession型に、カスタムユーザー情報を追加。
   */
  interface Session {
    /** ユーザー情報（デフォルトのユーザー情報 + カスタムプロパティ） */
    user: {
      /** ユーザーID（一意識別子） */
      id: string;
      /** ユーザー名（オプション） */
      username?: string;
      /** ユーザーロール（admin: 管理者、user: 一般ユーザー） */
      role: "admin" | "user";
    } & DefaultSession["user"];
  }

  /**
   * ユーザーオブジェクトの型定義
   *
   * NextAuthのデフォルトUser型に、カスタムプロパティを追加。
   */
  interface User {
    /** ユーザーID（一意識別子） */
    id: string;
    /** ユーザー名（オプション） */
    name?: string | null;
    /** メールアドレス（オプション） */
    email?: string | null;
    /** プロフィール画像URL（オプション） */
    image?: string | null;
    /** ユーザー名（オプション） */
    username?: string;
    /** ユーザーロール（admin: 管理者、user: 一般ユーザー） */
    role: "admin" | "user";
  }
}

/**
 * NextAuth JWT型の拡張
 */
declare module "next-auth/jwt" {
  /**
   * JWTトークンの型定義
   *
   * JWTトークンに含まれるカスタムクレームを定義。
   */
  interface JWT {
    /** ユーザーID（一意識別子） */
    id: string;
    /** ユーザー名（オプション） */
    username?: string;
    /** ユーザーロール（admin: 管理者、user: 一般ユーザー） */
    role: "admin" | "user";
  }
}
