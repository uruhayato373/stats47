
export interface D1DatabaseError {
  message?: string;
  cause?: unknown;
}

export function extractD1Error(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

export function extractD1QueryError(
  error: unknown,
  defaultMessage: string = "データベースクエリの実行に失敗しました"
): { error: Error; message: string } {
  if (!error) {
    const errorObj = new Error(defaultMessage);
    return { error: errorObj, message: defaultMessage };
  }

  const errorObj = extractD1Error(error);
  return { error: errorObj, message: errorObj.message };
}
