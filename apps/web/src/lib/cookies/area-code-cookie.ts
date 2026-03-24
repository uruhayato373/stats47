/**
 * 地域コード Cookie 管理ユーティリティ
 *
 * Zustand localStorage と同期して、サーバーサイドでも
 * 地域コードを読み取れるようにする。
 */

export const AREA_CODE_COOKIE_NAME = "area-code";
export const AREA_CODE_DEFAULT = "00000";

/**
 * クライアントサイドで地域コード Cookie を設定する
 */
export function setAreaCodeCookie(areaCode: string): void {
  document.cookie = `${AREA_CODE_COOKIE_NAME}=${encodeURIComponent(areaCode)};path=/;max-age=31536000;SameSite=Lax`;
}
