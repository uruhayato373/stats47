export declare const COMMON_SCHEMA_PATH: string;
export declare const COMMON_SCHEMA: { $id: string; $defs: Record<string, { pattern?: string }> };
export declare function addCommonSchema<T extends { getSchema(key: string): unknown; addSchema(schema: object): unknown }>(ajv: T): T;
export declare function commonPattern(name: string): RegExp;
export declare const NOTE_URL_PATTERN: RegExp;
export declare function assertDatasetShape(id: string, doc: unknown, options?: { root?: string }): void;
