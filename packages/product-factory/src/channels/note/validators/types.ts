/** note channel validator 共通の issue 型。 */
export interface NoteIssue {
  readonly code: string;
  /** 対象の productId / slug (あれば)。 */
  readonly ref?: string;
  readonly message: string;
}

export interface NoteValidationResult {
  readonly ok: boolean;
  readonly errors: readonly NoteIssue[];
  readonly warnings: readonly NoteIssue[];
}
