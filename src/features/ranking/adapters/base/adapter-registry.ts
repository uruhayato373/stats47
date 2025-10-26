/**
 * アダプターレジストリ
 * データソースアダプターの登録・管理
 */

import type { RankingDataAdapter } from "./adapter-interface";

/**
 * アダプターレジストリ
 * データソースアダプターの登録・管理
 */
export class RankingAdapterRegistry {
  private static adapters = new Map<string, RankingDataAdapter>();
  
  /**
   * アダプターを登録
   */
  static register(adapter: RankingDataAdapter): void {
    if (this.adapters.has(adapter.sourceId)) {
      console.warn(
        `Adapter ${adapter.sourceId} is already registered. Overwriting...`
      );
    }
    this.adapters.set(adapter.sourceId, adapter);
    console.log(`✅ Registered adapter: ${adapter.sourceId}`);
  }
  
  /**
   * アダプターを取得
   */
  static getAdapter(sourceId: string): RankingDataAdapter | undefined {
    return this.adapters.get(sourceId);
  }
  
  /**
   * すべてのアダプターを取得
   */
  static getAllAdapters(): RankingDataAdapter[] {
    return Array.from(this.adapters.values());
  }
  
  /**
   * 利用可能なアダプターのみ取得
   */
  static async getAvailableAdapters(): Promise<RankingDataAdapter[]> {
    const adapters = this.getAllAdapters();
    const availability = await Promise.all(
      adapters.map(async (adapter) => ({
        adapter,
        available: await adapter.isAvailable(),
      }))
    );
    
    return availability
      .filter((item) => item.available)
      .map((item) => item.adapter);
  }
  
  /**
   * アダプターを削除
   */
  static unregister(sourceId: string): boolean {
    return this.adapters.delete(sourceId);
  }
  
  /**
   * すべてのアダプターをクリア
   */
  static clear(): void {
    this.adapters.clear();
  }
  
  /**
   * 登録済みアダプターの一覧を取得
   */
  static getRegisteredSourceIds(): string[] {
    return Array.from(this.adapters.keys());
  }
}
