"use client";

import React, { useState } from "react";
import { Modal } from "@/components/atoms/Modal";
import { LoginForm } from "@/components/organisms/auth/LoginForm";
import { RegisterForm } from "@/components/organisms/auth/RegisterForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "register";
}

export function AuthModal({
  isOpen,
  onClose,
  initialTab = "login",
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);

  const handleLoginSuccess = () => {
    onClose();
  };

  const handleRegisterSuccess = () => {
    // 登録成功後はログインタブに切り替え
    setActiveTab("login");
  };

  const handleSwitchToLogin = () => {
    setActiveTab("login");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeTab === "login" ? "ログイン" : "新規登録"}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {activeTab === "login"
              ? "Stats47 管理画面"
              : "Stats47 アカウント作成"}
          </p>
        </div>

        {/* タブ切り替え */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === "login"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === "register"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            新規登録
          </button>
        </div>

        {/* フォーム */}
        {activeTab === "login" ? (
          <LoginForm onSuccess={handleLoginSuccess} />
        ) : (
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={handleSwitchToLogin}
          />
        )}

        {/* フッター */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {activeTab === "login" ? (
            <p>
              アカウントをお持ちでないですか？{" "}
              <button
                onClick={() => setActiveTab("register")}
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                新規登録
              </button>
            </p>
          ) : (
            <p>
              すでにアカウントをお持ちですか？{" "}
              <button
                onClick={() => setActiveTab("login")}
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                ログイン
              </button>
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
