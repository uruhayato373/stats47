"use client";

import React from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
            ログイン
          </h2>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            Stats47 管理画面
          </p>
        </div>

        <LoginForm />

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>アカウントをお持ちでないですか？</p>
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            新規登録
          </Link>
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>開発用アカウント:</p>
          <p>メール: admin@stats47.local / パスワード: admin123</p>
        </div>
      </div>
    </div>
  );
}
