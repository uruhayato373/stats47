import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Alert } from "../Alert";

describe("Alert", () => {
  describe("基本的な表示", () => {
    it("successタイプで正しく表示される", () => {
      render(<Alert type="success" message="成功メッセージ" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("成功メッセージ")).toBeInTheDocument();
      expect(screen.getByText("成功メッセージ")).toHaveClass(
        "text-sm",
        "font-medium"
      );
    });

    it("errorタイプで正しく表示される", () => {
      render(<Alert type="error" message="エラーメッセージ" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("エラーメッセージ")).toBeInTheDocument();
    });

    it("infoタイプで正しく表示される", () => {
      render(<Alert type="info" message="情報メッセージ" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("情報メッセージ")).toBeInTheDocument();
    });

    it("warningタイプで正しく表示される", () => {
      render(<Alert type="warning" message="警告メッセージ" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("警告メッセージ")).toBeInTheDocument();
    });
  });

  describe("アイコンの表示制御", () => {
    it("showIcon=trueでアイコンが表示される", () => {
      render(<Alert type="success" message="メッセージ" showIcon={true} />);

      // Checkアイコンが表示されることを確認（SVG要素の存在）
      const alertElement = screen.getByRole("alert");
      expect(alertElement.querySelector("svg")).toBeInTheDocument();
    });

    it("showIcon=falseでアイコンが表示されない", () => {
      render(<Alert type="success" message="メッセージ" showIcon={false} />);

      const alertElement = screen.getByRole("alert");
      expect(alertElement.querySelector("svg")).not.toBeInTheDocument();
    });
  });

  describe("カスタムアイコン", () => {
    const CustomIcon = ({ className }: { className?: string }) => (
      <div data-testid="custom-icon" className={className}>
        Custom
      </div>
    );

    it("カスタムアイコンが正しく表示される", () => {
      render(<Alert type="success" message="メッセージ" icon={CustomIcon} />);

      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
      expect(screen.getByTestId("custom-icon")).toHaveClass(
        "w-4",
        "h-4",
        "flex-shrink-0"
      );
    });
  });

  describe("閉じるボタン", () => {
    it("onDismissが提供された場合、閉じるボタンが表示される", () => {
      const onDismiss = vi.fn();
      render(
        <Alert type="success" message="メッセージ" onDismiss={onDismiss} />
      );

      const dismissButton = screen.getByLabelText("アラートを閉じる");
      expect(dismissButton).toBeInTheDocument();
    });

    it("onDismissが提供されていない場合、閉じるボタンが表示されない", () => {
      render(<Alert type="success" message="メッセージ" />);

      expect(
        screen.queryByLabelText("アラートを閉じる")
      ).not.toBeInTheDocument();
    });

    it("閉じるボタンをクリックするとonDismissが呼ばれる", () => {
      const onDismiss = vi.fn();
      render(
        <Alert type="success" message="メッセージ" onDismiss={onDismiss} />
      );

      const dismissButton = screen.getByLabelText("アラートを閉じる");
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("カスタムクラス", () => {
    it("classNameが正しく適用される", () => {
      render(
        <Alert type="success" message="メッセージ" className="custom-class" />
      );

      const alertElement = screen.getByRole("alert");
      expect(alertElement).toHaveClass("custom-class");
    });
  });

  describe("アクセシビリティ", () => {
    it("role=alertが設定される", () => {
      render(<Alert type="success" message="メッセージ" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("aria-live=politeが設定される", () => {
      render(<Alert type="success" message="メッセージ" />);

      const alertElement = screen.getByRole("alert");
      expect(alertElement).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("長いメッセージ", () => {
    it("長いメッセージが正しく表示される", () => {
      const longMessage =
        "これは非常に長いメッセージです。複数行にわたる可能性があり、適切に表示される必要があります。";

      render(<Alert type="info" message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });
});
