import { SignJWT, jwtVerify } from 'jose';

/**
 * JWT ペイロードの型定義
 */
export interface JWTPayload {
  /** ユーザーID */
  userId: number | string;

  /** ユーザーネーム */
  username: string;

  /** メールアドレス */
  email: string;

  /** ユーザーの役割 */
  role: 'admin' | 'user';

  /** セッションID */
  sessionId: string;

  /** 発行日時（Unix timestamp） */
  iat?: number;

  /** 有効期限（Unix timestamp） */
  exp?: number;
}

/**
 * JWT シークレットキーを取得
 *
 * @returns シークレットキー（UInt8Array）
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-characters-long';
  return new TextEncoder().encode(secret);
}

/**
 * JWT トークンを生成する
 *
 * @param payload - JWT ペイロード
 * @returns JWT トークン文字列
 *
 * @example
 * ```typescript
 * const token = await generateToken({
 *   userId: '123',
 *   username: 'john',
 *   email: 'john@example.com',
 *   role: 'user',
 *   sessionId: 'session-123',
 * });
 * ```
 */
export async function generateToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): Promise<string> {
  const secret = getJwtSecret();

  // 7日間の有効期限
  const expirationTime = '7d';

  const token = await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(secret);

  return token;
}

/**
 * JWT トークンを検証する
 *
 * @param token - JWT トークン文字列
 * @returns ペイロード（検証成功時）または null（検証失敗時）
 *
 * @example
 * ```typescript
 * const payload = await verifyToken(token);
 * if (payload) {
 *   console.log('User ID:', payload.userId);
 * } else {
 *   console.log('Invalid token');
 * }
 * ```
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getJwtSecret();

    const { payload } = await jwtVerify(token, secret);

    return payload as JWTPayload;
  } catch (error) {
    // トークンが無効、または有効期限切れ
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * トークンから有効期限を取得する（検証なし）
 *
 * @param token - JWT トークン文字列
 * @returns 有効期限（Unix timestamp）または null
 */
export function getTokenExpiration(token: string): number | null {
  try {
    // Base64デコードしてペイロードを取得（検証なし）
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload.exp || null;
  } catch (error) {
    return null;
  }
}

/**
 * トークンが有効期限切れかどうかを確認する（検証なし）
 *
 * @param token - JWT トークン文字列
 * @returns 有効期限切れの場合 true
 */
export function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiration(token);
  if (!exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return exp < now;
}
