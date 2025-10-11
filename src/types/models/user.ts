import { Email, UserId, Timestamp } from "../common/primitives";

/**
 * ユーザーの役割
 */
export type UserRole = "admin" | "user";

/**
 * ユーザー情報を表すインターフェース
 *
 * @remarks
 * この型は認証後のユーザー情報を表します。
 * OAuth プロバイダーの情報も含まれます。
 *
 * @example
 * ```typescript
 * const user: User = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   username: 'johndoe',
 *   role: 'admin',
 *   isActive: true,
 *   createdAt: '2025-01-01T00:00:00Z',
 *   updatedAt: '2025-01-01T00:00:00Z',
 * };
 * ```
 */
export interface User {
  /** ユーザーの一意識別子（UUID） */
  id: UserId;

  /** ユーザーの表示名 */
  name: string;

  /** メールアドレス（一意） */
  email: Email;

  /** ユーザーネーム（ログイン用、一意） */
  username?: string;

  /** ユーザーの役割 */
  role: UserRole;

  /** プロフィール画像のURL */
  image?: string;

  /** アカウントの有効フラグ */
  isActive: boolean;

  /** 最終ログイン日時 */
  lastLogin?: Timestamp;

  /** 作成日時 */
  createdAt: Timestamp;

  /** 更新日時 */
  updatedAt: Timestamp;
}

/**
 * ユーザー作成時のデータ
 */
export interface UserCreateInput {
  name: string;
  email: Email;
  username: string;
  password: string;
  role?: UserRole;
}

/**
 * ユーザー更新時のデータ
 */
export interface UserUpdateInput {
  name?: string;
  email?: Email;
  username?: string;
  role?: UserRole;
  isActive?: boolean;
  image?: string;
}

/**
 * セッション内のユーザー情報
 */
export interface SessionUser
  extends Pick<User, "id" | "name" | "email" | "role" | "image"> {}
