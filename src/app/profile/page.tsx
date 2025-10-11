"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Calendar, Shield } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ログインが必要です
          </h1>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {user.name || user.username}
                </h1>
                <p className="text-indigo-100">{user.email}</p>
                {user.role === "admin" && (
                  <div className="flex items-center mt-2">
                    <Shield className="w-4 h-4 text-yellow-300 mr-1" />
                    <span className="text-yellow-300 text-sm font-medium">
                      管理者
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 基本情報 */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  基本情報
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ユーザーネーム
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {user.username || "未設定"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        メールアドレス
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        登録日
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        2025年1月11日
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* アクション */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  アクション
                </h2>
                <div className="space-y-3">
                  <Link
                    href="/profile/edit"
                    className="block w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center transition-colors"
                  >
                    プロフィール編集
                  </Link>
                  <Link
                    href="/profile/change-password"
                    className="block w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center transition-colors"
                  >
                    パスワード変更
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center transition-colors"
                    >
                      管理画面
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
