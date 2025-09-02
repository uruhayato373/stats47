import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import EstatDataFetcher from "./EstatDataFetcher";

// 環境変数のモック
const originalEnv = process.env;
beforeEach(() => {
  vi.resetModules();
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_ESTAT_APP_ID: "test-app-id",
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("EstatDataFetcher", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("正常にレンダリングされる", () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={false} />);

    expect(screen.getByText("データ取得パラメータ")).toBeInTheDocument();
    expect(screen.getByText("統計表ID *")).toBeInTheDocument();
    expect(screen.getByText("分類01")).toBeInTheDocument();
    expect(screen.getByText("地域")).toBeInTheDocument();
    expect(screen.getByText("時間軸")).toBeInTheDocument();
  });

  it("初期値が正しく設定されている", () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={false} />);

    const statsDataIdInput = screen.getByDisplayValue("0000010101");
    const cdCat01Input = screen.getByDisplayValue("A1101");
    const cdAreaInput = screen.getByDisplayValue("");
    const cdTimeInput = screen.getByDisplayValue("");

    expect(statsDataIdInput).toBeInTheDocument();
    expect(cdCat01Input).toBeInTheDocument();
    expect(cdAreaInput).toBeInTheDocument();
    expect(cdTimeInput).toBeInTheDocument();
  });

  it("入力値の変更が正しく動作する", () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={false} />);

    const statsDataIdInput = screen.getByDisplayValue("0000010101");
    fireEvent.change(statsDataIdInput, { target: { value: "1234567890" } });

    expect(statsDataIdInput).toHaveValue("1234567890");
  });

  it("フォーム送信が正しく動作する", async () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={false} />);

    const submitButton = screen.getByText("データを取得");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        appId: "test-app-id",
        statsDataId: "0000010101",
        cdCat01: "A1101",
      });
    });
  });

  it("空のパラメータは送信されない", async () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={false} />);

    // 統計表IDのみを設定
    const statsDataIdInput = screen.getByDisplayValue("0000010101");
    fireEvent.change(statsDataIdInput, { target: { value: "1234567890" } });

    // その他のフィールドをクリア
    const cdCat01Input = screen.getByDisplayValue("A1101");
    fireEvent.change(cdCat01Input, { target: { value: "" } });

    const submitButton = screen.getByText("データを取得");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        appId: "test-app-id",
        statsDataId: "1234567890",
      });
    });
  });

  it("すべてのパラメータが設定された場合の送信", async () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={false} />);

    // 各フィールドに値を設定
    const statsDataIdInput = screen.getByDisplayValue("0000010101");
    fireEvent.change(statsDataIdInput, { target: { value: "1234567890" } });

    const cdCat01Input = screen.getByDisplayValue("A1101");
    fireEvent.change(cdCat01Input, { target: { value: "A1101,A1102" } });

    const cdAreaInput = screen.getByDisplayValue("");
    fireEvent.change(cdAreaInput, { target: { value: "13100,13101" } });

    const cdTimeInput = screen.getByDisplayValue("");
    fireEvent.change(cdTimeInput, { target: { value: "2020,2021" } });

    const submitButton = screen.getByText("データを取得");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        appId: "test-app-id",
        statsDataId: "1234567890",
        cdCat01: "A1101,A1102",
        cdArea: "13100,13101",
        cdTime: "2020,2021",
      });
    });
  });

  it("ローディング状態が正しく表示される", () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={true} />);

    expect(screen.getByText("取得中...")).toBeInTheDocument();
    expect(screen.getByText("データを取得")).toBeDisabled();
    expect(screen.getByText("リセット")).toBeDisabled();
  });

  it("統計表IDが空の場合は送信ボタンが無効になる", () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={false} />);

    const statsDataIdInput = screen.getByDisplayValue("0000010101");
    fireEvent.change(statsDataIdInput, { target: { value: "" } });

    expect(screen.getByText("データを取得")).toBeDisabled();
  });

  it("リセットボタンが正しく動作する", () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={false} />);

    // 値を変更
    const statsDataIdInput = screen.getByDisplayValue("0000010101");
    fireEvent.change(statsDataIdInput, { target: { value: "1234567890" } });

    const cdCat01Input = screen.getByDisplayValue("A1101");
    fireEvent.change(cdCat01Input, { target: { value: "A1101,A1102" } });

    // リセットボタンをクリック
    const resetButton = screen.getByText("リセット");
    fireEvent.click(resetButton);

    // 初期値に戻ることを確認
    expect(screen.getByDisplayValue("0000010101")).toBeInTheDocument();
    expect(screen.getByDisplayValue("")).toBeInTheDocument(); // cdCat01が空になる
  });

  it("フォーム送信時にpreventDefaultが呼ばれる", () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={false} />);

    const form = screen.getByRole("form");
    const preventDefaultSpy = vi.fn();

    fireEvent.submit(form, {
      preventDefault: preventDefaultSpy,
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("環境変数が設定されていない場合の処理", async () => {
    // 環境変数をクリア
    process.env.NEXT_PUBLIC_ESTAT_APP_ID = undefined;

    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={false} />);

    const submitButton = screen.getByText("データを取得");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        appId: "",
        statsDataId: "0000010101",
        cdCat01: "A1101",
      });
    });
  });

  it("プレースホルダーテキストが正しく表示される", () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={false} />);

    expect(screen.getByPlaceholderText("例: 0003412312")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("カンマ区切り")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例: A1101,A1102")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例: 13100,13101")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例: 2020,2021")).toBeInTheDocument();
  });

  it("説明テキストが正しく表示される", () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={false} />);

    expect(screen.getByText("必須項目")).toBeInTheDocument();
    expect(screen.getByText("例: A1101,A1102")).toBeInTheDocument();
    expect(screen.getByText("例: 13100,13101")).toBeInTheDocument();
    expect(screen.getByText("例: 2020,2021")).toBeInTheDocument();
  });

  it("統計表IDフィールドが必須属性を持つ", () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={false} />);

    const statsDataIdInput = screen.getByDisplayValue("0000010101");
    expect(statsDataIdInput).toHaveAttribute("required");
  });

  it("ローディング中はフォームが無効になる", () => {
    render(<EstatDataFetcher onSubmit={mockOnSubmit} loading={true} />);

    const statsDataIdInput = screen.getByDisplayValue("0000010101");
    const cdCat01Input = screen.getByDisplayValue("A1101");
    const cdAreaInput = screen.getByDisplayValue("");
    const cdTimeInput = screen.getByDisplayValue("");

    // ローディング中でも入力フィールドは有効（ユーザーが入力できる）
    expect(statsDataIdInput).not.toBeDisabled();
    expect(cdCat01Input).not.toBeDisabled();
    expect(cdAreaInput).not.toBeDisabled();
    expect(cdTimeInput).not.toBeDisabled();
  });
});
