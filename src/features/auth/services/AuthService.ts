import type { User } from '../types';
import { runQuery } from '../db/d1';
import fs from 'fs/promises';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const MOCK_PATH = 'data/mock/auth/users.json';

export class AuthService {
  static async login(email: string, passwordHash: string): Promise<User | null> {
    if (USE_MOCK) {
      const mockUsers: User[] = JSON.parse(await fs.readFile(MOCK_PATH, 'utf-8'));
      return mockUsers.find(u => u.email === email && u.passwordHash === passwordHash) || null;
    }
    // D1: SQLite実際の認証
    const result = await runQuery('SELECT * FROM users WHERE email = ? AND password_hash = ?', email, passwordHash);
    const user = result?.results?.[0];
    if (!user) return null;
    return user as User;
  }

  static async getCurrentUser(userId: string): Promise<User | null> {
    if (USE_MOCK) {
      const mockUsers: User[] = JSON.parse(await fs.readFile(MOCK_PATH, 'utf-8'));
      return mockUsers.find(u => u.id === userId) || null;
    }
    const result = await runQuery('SELECT * FROM users WHERE id = ?', userId);
    return result?.results?.[0] || null;
  }

  static checkPermission(user: User | null, role: 'admin' | 'user'): boolean {
    if (!user) return false;
    if (role === 'admin' && user.role !== 'admin') return false;
    return true;
  }
}
