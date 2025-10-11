"use client";

import React from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
            新規登録
          </h2>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            Stats47 アカウント作成
          </p>
        </div>

        <RegisterForm />

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>すでにアカウントをお持ちですか？</p>
          <a
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            ログイン
          </a>
        </div>
      </div>
    </div>
  );
}
