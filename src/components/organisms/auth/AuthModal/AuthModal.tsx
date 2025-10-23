"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/molecules/ui/tabs";
import { LoginForm } from "@/components/organisms/auth/LoginForm";
import { RegisterForm } from "@/components/organisms/auth/RegisterForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {activeTab === "login" ? "ログイン" : "新規登録"}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "login" | "register")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">ログイン</TabsTrigger>
            <TabsTrigger value="register">新規登録</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <LoginForm onSuccess={handleLoginSuccess} />
            <div className="text-center text-sm text-muted-foreground">
              <p>
                アカウントをお持ちでないですか？{" "}
                <button
                  onClick={() => setActiveTab("register")}
                  className="font-medium text-primary hover:text-primary/90"
                >
                  新規登録
                </button>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
            <div className="text-center text-sm text-muted-foreground">
              <p>
                すでにアカウントをお持ちですか？{" "}
                <button
                  onClick={() => setActiveTab("login")}
                  className="font-medium text-primary hover:text-primary/90"
                >
                  ログイン
                </button>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
