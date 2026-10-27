export function readLinkCardLedger<T>(file: string): T;
export function writeLinkCardLedger<T extends { entries: ReadonlyArray<{ id: string }> }>(file: string, ledger: T): void;
