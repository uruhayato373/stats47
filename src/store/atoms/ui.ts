import { atom } from 'jotai';

// UI状態管理
export const sidebarOpenAtom = atom(true);
export const mobileMenuOpenAtom = atom(false);
export const loadingAtom = atom(false);
export const errorAtom = atom<string | null>(null);

// モーダル・ダイアログ状態
export const modalOpenAtom = atom(false);
export const modalContentAtom = atom<string | null>(null);

// テーマ設定
export const themeAtom = atom<'light' | 'dark'>('light');

// 通知システム
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export const notificationsAtom = atom<Notification[]>([]);

export const addNotificationAtom = atom(
  null,
  (get, set, notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    const current = get(notificationsAtom);
    set(notificationsAtom, [...current, newNotification]);
    
    // 自動削除（デフォルト5秒）
    const duration = notification.duration || 5000;
    setTimeout(() => {
      const currentNotifications = get(notificationsAtom);
      set(notificationsAtom, currentNotifications.filter(n => n.id !== id));
    }, duration);
  }
);

export const removeNotificationAtom = atom(
  null,
  (get, set, id: string) => {
    const current = get(notificationsAtom);
    set(notificationsAtom, current.filter(n => n.id !== id));
  }
);

// 検索・フィルタリング
export const searchQueryAtom = atom('');
export const sortFieldAtom = atom<string>('name');
export const sortDirectionAtom = atom<'asc' | 'desc'>('asc');

// ページネーション
export const currentPageAtom = atom(1);
export const itemsPerPageAtom = atom(10);

// 選択状態
export const selectedItemsAtom = atom<string[]>([]);

export const selectItemAtom = atom(
  null,
  (get, set, itemId: string) => {
    const current = get(selectedItemsAtom);
    if (current.includes(itemId)) {
      set(selectedItemsAtom, current.filter(id => id !== itemId));
    } else {
      set(selectedItemsAtom, [...current, itemId]);
    }
  }
);

export const selectAllItemsAtom = atom(
  null,
  (get, set, itemIds: string[]) => {
    const current = get(selectedItemsAtom);
    const allSelected = itemIds.every(id => current.includes(id));
    
    if (allSelected) {
      set(selectedItemsAtom, current.filter(id => !itemIds.includes(id)));
    } else {
      const newSelection = [...new Set([...current, ...itemIds])];
      set(selectedItemsAtom, newSelection);
    }
  }
);

export const clearSelectionAtom = atom(
  null,
  (get, set) => {
    set(selectedItemsAtom, []);
  }
);