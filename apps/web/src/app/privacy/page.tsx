/**
 * プライバシーポリシーページ
 *
 * プライバシーポリシーを表示する静的ページです。
 * 個人情報保護方針、Cookie使用、広告配信に関する情報を説明します。
 *
 * 主な内容:
 * - 個人情報の取得と利用目的
 * - Cookie使用について（Google Analytics）
 * - 広告配信について（Google AdSense）
 * - 第三者提供
 * - 安全管理措置
 * - 開示・訂正・削除
 * - お問い合わせ窓口
 *
 * アーキテクチャ:
 * - Next.js 15 App Router のサーバーコンポーネント
 * - 静的ページとして実装
 * - LegalSection を使用したセクション構造
 * - モバイルファーストのレスポンシブデザイン
 */

import { ReactNode } from "react";

import { Badge } from "@stats47/components/atoms/ui/badge";
import { Button } from "@stats47/components/atoms/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { Separator } from "@stats47/components/atoms/ui/separator";
import { ExternalLink, Instagram, MapPin, Youtube } from "lucide-react";

interface LegalSectionProps {
  /** セクション番号（例: "1", "第1条"） */
  number?: string;
  /** セクションタイトル */
  title: string;
  /** セクション内容 */
  children: ReactNode;
}

/**
 * 法的ドキュメント用セクションコンポーネント
 *
 * プライバシーポリシー、利用規約などの法的ドキュメントで使用する
 * 番号付きセクションカードコンポーネントです。
 */
function LegalSection({ number, title, children }: LegalSectionProps) {
  const displayTitle = number ? `${number}. ${title}` : title;

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg md:text-xl">{displayTitle}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">{children}</CardContent>
    </Card>
  );
}

// 静的ページとして生成（24時間ごとに再検証）

// 最終更新日（静的ページなので定数化）
const LAST_UPDATED_DATE = new Date("2026-01-25");

// 外部リンクURL
const EXTERNAL_LINKS = {
  googlePrivacyPolicy: "https://policies.google.com/privacy",
  googleAdSettings: "https://www.google.com/settings/ads",
  contactForm: "https://forms.gle/ZYi7Rmk4Kt9qZCXB8",
  noteProfile: "https://note.com/stats47",
  instagram: "https://www.instagram.com/stats47jp/",
  youtube: "https://www.youtube.com/@stats47jp",
} as const;

// 共通テキストスタイルクラス
const TEXT_STYLE = "text-xs leading-relaxed md:text-sm";
const TEXT_STYLE_WITH_MARGIN = "text-xs leading-relaxed mb-4 md:text-sm";

/**
 * ページメタデータ
 */
export const metadata = {
  title: "プライバシーポリシー | 統計で見る都道府県",
  description:
    "統計で見る都道府県（stats47）のプライバシーポリシー。個人情報の取り扱い、Cookie使用、広告配信に関する方針を説明します。",
  alternates: {
    canonical: "/privacy",
  },
};

/**
 * プライバシーポリシーページコンポーネント
 *
 * @returns プライバシーポリシーページのJSX要素
 */
export default function PrivacyPage() {
  return (
    <main className="px-4 py-6 md:px-6 md:py-8">
      {/* ページヘッダー */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-lg font-bold mb-4">プライバシーポリシー</h1>
        <p className={`${TEXT_STYLE} text-muted-foreground`}>
          統計で見る都道府県（以下「当サービス」）は、ユーザーの個人情報の保護を重要視しています。本プライバシーポリシーは、当サービスがどのように個人情報を収集、使用、保護するかについて説明します。
        </p>
      </div>

      {/* カードセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

        {/* 1. 運営者情報 / 2. 個人情報の取得 — 2列 */}
        <LegalSection number="1" title="運営者情報">
          {/* プロフィール */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary">K</span>
            </div>
            <div>
              <p className="font-semibold text-sm md:text-base">KAZU</p>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">東京都</span>
              </div>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* サービス情報 */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">サービス</span>
              <Badge variant="secondary" className="text-xs font-normal">
                統計で見る都道府県（stats47）
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">活動拠点</span>
              <Badge variant="outline" className="text-xs font-normal">
                東京都
              </Badge>
            </div>
          </div>

          {/* SNSリンク */}
          <div className="flex flex-col gap-2">
            <a
              href={EXTERNAL_LINKS.noteProfile}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" size="sm" className="w-full gap-2">
                <span className="font-bold text-[#41c9b4]">note</span>
                <span className="text-xs">で発信中</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </a>
            <a
              href={EXTERNAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Instagram className="h-4 w-4 text-[#E1306C]" />
                <span className="text-xs">@stats47jp</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </a>
            <a
              href={EXTERNAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Youtube className="h-4 w-4 text-[#FF0000]" />
                <span className="text-xs">YouTube チャンネル</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </a>
          </div>
        </LegalSection>

        <LegalSection number="2" title="個人情報の取得">
          <p className={TEXT_STYLE_WITH_MARGIN}>
            当サービスは、以下の場合に個人情報を取得することがあります。
          </p>
          <ul className={`space-y-2 ${TEXT_STYLE}`}>
            <li>ユーザー登録時（メールアドレス、ユーザー名など）</li>
            <li>
              お問い合わせフォーム送信時（お名前、メールアドレス、お問い合わせ内容）
            </li>
            <li>サービス利用時（アクセスログ、Cookie情報など）</li>
          </ul>
        </LegalSection>

        {/* 3. 個人情報の利用目的 / 6. 第三者提供 — 2列 */}
        <LegalSection number="3" title="個人情報の利用目的">
          <p className={TEXT_STYLE_WITH_MARGIN}>
            当サービスは、取得した個人情報を以下の目的で利用します。
          </p>
          <ul className={`space-y-2 ${TEXT_STYLE}`}>
            <li>当サービスの提供・運営・改善のため</li>
            <li>お問い合わせ対応のため</li>
            <li>不正行為の防止、セキュリティ確保のため</li>
            <li>サービスに関する重要なお知らせの配信</li>
            <li>利用状況の分析とサービス品質の向上</li>
          </ul>
        </LegalSection>

        <LegalSection number="6" title="第三者提供">
          <p className={TEXT_STYLE_WITH_MARGIN}>
            当サービスは、以下の場合を除き、本人の同意なく個人情報を第三者へ提供しません。
          </p>
          <ul className={`space-y-2 ${TEXT_STYLE}`}>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合</li>
            <li>
              公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合
            </li>
            <li>
              国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合
            </li>
          </ul>
        </LegalSection>

        {/* 4. Cookie — 全幅 */}
        <div className="lg:col-span-2">
          <LegalSection number="4" title="Cookie（クッキー）の使用について">
            <div className="space-y-4">
              <p className={TEXT_STYLE}>
                当サービスは、サービス品質の向上と利用状況の分析のため、Cookieを使用しています。
              </p>
              <div>
                <h3 className="text-sm font-semibold mb-3 md:text-base">
                  4.1 使用するCookie
                </h3>
                <ul className={`space-y-2 ${TEXT_STYLE}`}>
                  <li>
                    <strong>Google Analytics</strong>: アクセス解析のため
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>
                        ページビュー数、滞在時間、離脱率などの統計情報を収集
                      </li>
                      <li>個人を特定する情報は含まれません</li>
                      <li>
                        Google Analyticsのプライバシーポリシー:{" "}
                        <a
                          href={EXTERNAL_LINKS.googlePrivacyPolicy}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {EXTERNAL_LINKS.googlePrivacyPolicy}
                        </a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3 md:text-base">
                  4.2 Cookieの無効化
                </h3>
                <p className={TEXT_STYLE}>
                  ブラウザの設定により、Cookieを無効にすることができます。
                  ただし、Cookieを無効にした場合、一部の機能が正常に動作しない可能性があります。
                </p>
              </div>
            </div>
          </LegalSection>
        </div>

        {/* 5. 広告配信 — 全幅 */}
        <div className="lg:col-span-2">
          <LegalSection number="5" title="広告配信について">
            <div className="space-y-4">
              <p className={TEXT_STYLE}>
                当サービスは、第三者配信の広告サービス（Google
                AdSense）を利用しています。
                広告配信プロバイダーは、ユーザーが当サービスや他のウェブサイトにアクセスした際の情報に基づいて、
                適切な広告を配信する場合があります。
              </p>
              <div>
                <h3 className="text-sm font-semibold mb-3 md:text-base">
                  5.1 広告配信プロバイダー
                </h3>
                <ul className={`space-y-2 ${TEXT_STYLE}`}>
                  <li>
                    <strong>Google AdSense</strong>
                    <ul className="mt-2 ml-4 space-y-1">
                      <li>
                        Google AdSenseのプライバシーポリシー:{" "}
                        <a
                          href={EXTERNAL_LINKS.googlePrivacyPolicy}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {EXTERNAL_LINKS.googlePrivacyPolicy}
                        </a>
                      </li>
                      <li>
                        Google AdSenseのオプトアウト:{" "}
                        <a
                          href={EXTERNAL_LINKS.googleAdSettings}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {EXTERNAL_LINKS.googleAdSettings}
                        </a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              <p className={TEXT_STYLE}>
                広告配信プロバイダーは、Cookieを使用して、ユーザーが過去にアクセスしたウェブサイトの情報に基づいて広告を配信します。
                ユーザーは、上記のオプトアウトページから、パーソナライズド広告の配信を停止することができます。
              </p>
            </div>
          </LegalSection>
        </div>

        {/* 7. 安全管理措置 / 8. 個人情報の開示・訂正・削除 — 2列 */}
        <LegalSection number="7" title="安全管理措置">
          <p className={TEXT_STYLE}>
            当サービスは、個人情報の漏えい、滅失又はき損の防止その他の安全管理のために、
            必要かつ適切な技術的・組織的安全管理措置を講じます。
          </p>
        </LegalSection>

        <LegalSection number="8" title="個人情報の開示・訂正・削除">
          <p className={TEXT_STYLE}>
            利用者からの個人情報の開示・訂正・削除等の請求には、法令に従い適切に対応します。
            ご請求の際は、お問い合わせ窓口までご連絡ください。
          </p>
        </LegalSection>

        {/* 9. プライバシーポリシーの変更 / 10. お問い合わせ窓口 — 2列 */}
        <LegalSection number="9" title="プライバシーポリシーの変更">
          <p className={TEXT_STYLE}>
            本ポリシーは、必要に応じて予告なく変更することがあります。
            変更後のプライバシーポリシーは、当ページに掲載した時点より効力を生じるものとします。
          </p>
        </LegalSection>

        <LegalSection number="10" title="お問い合わせ窓口">
          <p className={TEXT_STYLE_WITH_MARGIN}>
            本プライバシーポリシーに関するお問い合わせ、個人情報の開示・訂正・削除のご請求は、
            以下のGoogleフォームよりお願いいたします。
          </p>
          <p>
            <a
              href={EXTERNAL_LINKS.contactForm}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium text-xs md:text-sm"
            >
              お問い合わせフォーム
            </a>
          </p>
        </LegalSection>

      </div>

      {/* フッター */}
      <footer className="text-xs text-muted-foreground border-t border-border pt-6 mt-8">
        <p>最終更新日: {LAST_UPDATED_DATE.toLocaleDateString("ja-JP")}</p>
      </footer>
    </main>
  );
}
