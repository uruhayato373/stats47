/**
 * Result型とユーティリティ関数
 *
 * エラーハンドリングを統一するためのResult型パターンを提供します。
 * エラーを例外としてスローする代わりに、戻り値として返すことで、
 * 型安全で一貫性のあるエラーハンドリングを実現します。
 */

/**
 * Result型
 *
 * 成功時は`{ success: true, data: T }`、失敗時は`{ success: false, error: E }`を返します。
 *
 * @example
 * ```typescript
 * const result = await fetchData();
 * if (isOk(result)) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * 成功結果を作成
 *
 * @param data - 成功時のデータ
 * @returns 成功結果
 *
 * @example
 * ```typescript
 * const result = ok({ id: 1, name: "test" });
 * ```
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * エラー結果を作成
 *
 * @param error - エラーオブジェクトまたはエラーメッセージ
 * @returns エラー結果
 *
 * @example
 * ```typescript
 * const result = err(new Error("処理に失敗しました"));
 * const result2 = err("処理に失敗しました"); // 文字列も可
 * ```
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * 成功結果かどうかを判定する型ガード
 *
 * @param result - 判定するResult型の値
 * @returns 成功結果の場合true
 *
 * @example
 * ```typescript
 * const result = await fetchData();
 * if (isOk(result)) {
 *   // resultは{ success: true, data: T }として型推論される
 *   console.log(result.data);
 * }
 * ```
 */
export function isOk<T, E>(
  result: Result<T, E>
): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * エラー結果かどうかを判定する型ガード
 *
 * @param result - 判定するResult型の値
 * @returns エラー結果の場合true
 *
 * @example
 * ```typescript
 * const result = await fetchData();
 * if (isErr(result)) {
 *   // resultは{ success: false, error: E }として型推論される
 *   console.error(result.error);
 * }
 * ```
 */
export function isErr<T, E>(
  result: Result<T, E>
): result is { success: false; error: E } {
  return result.success === false;
}

/**
 * 成功値を取得（エラー時は例外をスロー）
 *
 * 注意: この関数はエラー時に例外をスローするため、使用時は注意が必要です。
 * 可能な限り`isOk()`/`isErr()`を使用したエラーハンドリングを推奨します。
 *
 * @param result - Result型の値
 * @returns 成功時のデータ
 * @throws エラー結果の場合、エラーをスロー
 *
 * @example
 * ```typescript
 * const result = await fetchData();
 * try {
 *   const data = unwrap(result);
 *   console.log(data);
 * } catch (error) {
 *   console.error(error);
 * }
 * ```
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.data;
  }
  throw result.error;
}
