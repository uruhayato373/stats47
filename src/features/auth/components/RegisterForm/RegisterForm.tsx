"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PasswordInput } from "@/components/atoms/ui/password-input";

export interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // バリデーション
    if (formData.password !== formData.confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (formData.password.length < 8) {
      setError("パスワードは8文字以上である必要があります");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error || "登録に失敗しました");
        return;
      }

      // 登録成功 -> ログインタブに切り替え
      onSuccess?.();
    } catch (err) {
      setError("登録中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* ユーザーネーム */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-foreground mb-1"
        >
          ユーザーネーム
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-primary"
          placeholder="username"
        />
      </div>

      {/* メールアドレス */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground mb-1"
        >
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-primary"
          placeholder="email@example.com"
        />
      </div>

      {/* パスワード */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground mb-1"
        >
          パスワード
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          showStrength
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          placeholder="8文字以上"
        />
      </div>

      {/* パスワード確認 */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-foreground mb-1"
        >
          パスワード（確認）
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          placeholder="パスワードを再入力"
        />
      </div>

      {/* 利用規約 */}
      <div className="flex items-start">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          required
          className="h-4 w-4 mt-1 text-primary focus:ring-ring border-input rounded"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-foreground">
          <Link href="/terms" className="text-primary hover:text-primary/80">
            利用規約
          </Link>
          と
          <Link href="/privacy" className="text-primary hover:text-primary/80">
            プライバシーポリシー
          </Link>
          に同意します
        </label>
      </div>

      {/* 登録ボタン */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "登録中..." : "新規登録"}
      </button>
    </form>
  );
}
