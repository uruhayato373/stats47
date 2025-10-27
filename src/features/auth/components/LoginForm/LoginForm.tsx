"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { signIn } from "next-auth/react";

import { PasswordInput } from "@/components/atoms/ui/password-input";

export interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("メールアドレスまたはパスワードが正しくありません");
      } else {
        // ログイン成功
        onSuccess?.(); // モーダルを閉じる
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("ログイン中にエラーが発生しました");
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {/* パスワードを忘れた */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-sm text-foreground"
          >
            ログイン状態を保持
          </label>
        </div>

        <div className="text-sm">
          <Link
            href="/forgot-password"
            className="font-medium text-primary hover:text-primary/80"
          >
            パスワードを忘れた？
          </Link>
        </div>
      </div>

      {/* ログインボタン */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
