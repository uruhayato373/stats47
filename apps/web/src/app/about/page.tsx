/**
 * About ページ（運営者情報・サイト趣旨・E-E-A-T 強化）
 *
 * T3-EEAT-01 施策の一環で、Google の Experience / Expertise / Authoritativeness /
 * Trustworthiness 評価を高めるために運営者情報と運営方針を明示するページ。
 *
 * 主な内容:
 * - 運営者プロフィール（KAZU、元県庁職員 20 年）
 * - stats47 のミッションと存在意義
 * - データソース（e-Stat 等の一次情報）
 * - 編集方針（客観性・中立性・出典明示）
 * - お問い合わせ
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
import { ExternalLink, Instagram, MapPin, Youtube, Briefcase, Target } from "lucide-react";

import { getRequiredBaseUrl } from "@/lib/env";
import { buildOperatorPersonSchema } from "@/lib/structured-data/person";
import { buildOrganizationSchema } from "@/lib/structured-data/scripts";

import type { Metadata } from "next";

interface AboutSectionProps {
  title: string;
  children: ReactNode;
}

function AboutSection({ title, children }: AboutSectionProps) {
  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">{children}</CardContent>
    </Card>
  );
}

const EXTERNAL_LINKS = {
  eStat: "https://www.e-stat.go.jp/",
  contactForm: "https://forms.gle/ZYi7Rmk4Kt9qZCXB8",
  noteProfile: "https://note.com/stats47",
  instagram: "https://www.instagram.com/stats47jp/",
  youtube: "https://www.youtube.com/@stats47jp",
  x: "https://x.com/stats47jp",
} as const;

const TEXT_STYLE = "text-xs leading-relaxed md:text-sm";
const TEXT_STYLE_WITH_MARGIN = "text-xs leading-relaxed mb-4 md:text-sm";

export const metadata: Metadata = {
  title: "このサイトについて | 統計で見る都道府県",
  description:
    "統計で見る都道府県（stats47）の運営方針と運営者情報。元県庁職員 20 年の経験をもとに、e-Stat 等の一次統計データを分かりやすく可視化。編集方針・データソース・お問い合わせ。",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "このサイトについて | 統計で見る都道府県",
    description:
      "元県庁職員 20 年の開発者が運営する統計可視化サイト。公的統計を正確・中立に届ける編集方針。",
    type: "website",
    url: "https://stats47.jp/about",
  },
};

export default function AboutPage() {
  const baseUrl = getRequiredBaseUrl();
  // E-E-A-T 構造化データ（#76 T3-EEAT-02）
  const personSchema = buildOperatorPersonSchema(baseUrl);
  const organizationSchema = buildOrganizationSchema(baseUrl);
  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "このサイトについて | 統計で見る都道府県",
    url: `${baseUrl}/about`,
    mainEntity: {
      "@type": "Person",
      name: "KAZU",
      url: `${baseUrl}/about`,
    },
    about: {
      "@type": "Organization",
      name: "統計で見る都道府県",
      url: baseUrl,
    },
    inLanguage: "ja",
  };

  return (
    <main className="px-4 py-6 md:px-6 md:py-8">
      {/* 構造化データ: Person (運営者) / Organization / AboutPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />

      {/* ページヘッダー */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold mb-4">このサイトについて</h1>
        <p className={`${TEXT_STYLE} text-muted-foreground`}>
          統計で見る都道府県（stats47）は、47 都道府県の公的統計データを「誰でも使える形」にリデザインする個人運営サイトです。元県庁職員 20 年の経験をもとに、e-Stat などの一次データを可視化し、独自の分析と解説を添えてお届けします。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* 1. 運営者プロフィール */}
        <AboutSection title="運営者プロフィール">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary">K</span>
            </div>
            <div>
              <p className="font-semibold text-base">KAZU</p>
              <p className="text-xs text-muted-foreground">
                元県庁職員 20 年 / データ可視化コンサルタント
              </p>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">東京都</span>
              </div>
            </div>
          </div>

          <Separator className="mb-4" />

          <p className={TEXT_STYLE_WITH_MARGIN}>
            20 年間、自治体職員として統計の「作る現場」と「使う現場」の両方に身を置いてきました。作る立場で見てきたのは、多くの職員が膨大な手間と時間をかけ、1 件 1 件の数字に込める真摯な仕事。しかし使う立場になると、その貴重なデータは複雑なサイトの奥底に眠り、<strong>どこに何があるか分からず、見つけても加工しなければ使い物にならない</strong>という現実に直面しました。
          </p>
          <p className={TEXT_STYLE_WITH_MARGIN}>
            stats47 は、この「探す苦労」と「加工する手間」をゼロにするために 2024 年 10 月に立ち上げたプロジェクトです。公的データの正確性はそのままに、現代の UI/UX で「すぐに使える形」へとリデザインしています。
          </p>

          {/* SNS / 外部プロフィール */}
          <Separator className="my-4" />
          <div className="flex flex-col gap-2">
            <a href={EXTERNAL_LINKS.noteProfile} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <span className="font-bold text-[#41c9b4]">note</span>
                <span className="text-xs">統計の読み方を解説</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </a>
            <a href={EXTERNAL_LINKS.x} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <span className="font-bold">X</span>
                <span className="text-xs">最新ランキングを投稿</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </a>
            <a href={EXTERNAL_LINKS.instagram} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Instagram className="h-3 w-3" />
                <span className="text-xs">インフォグラフィック</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </a>
            <a href={EXTERNAL_LINKS.youtube} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Youtube className="h-3 w-3" />
                <span className="text-xs">ランキング動画</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </a>
          </div>
        </AboutSection>

        {/* 2. ミッション・ビジョン */}
        <AboutSection title="ミッション">
          <div className="flex items-start gap-2 mb-4">
            <Target className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
            <p className={`${TEXT_STYLE} font-semibold`}>
              統計をもっと身近に。探す手間、加工する苦労をなくし、誰もがデータを「使える」社会をつくる。
            </p>
          </div>
          <p className={TEXT_STYLE_WITH_MARGIN}>
            行政が手間と時間をかけて作り上げた統計の価値を、「データの翻訳者」として届ける。単なる数値の可視化ツールではなく、<strong>統計をもっと身近にするための総合プラットフォーム</strong>を目指しています。
          </p>
          <Separator className="my-4" />
          <p className="text-xs font-semibold mb-2">目指す状態</p>
          <ul className={`${TEXT_STYLE} list-disc pl-5 space-y-1 text-muted-foreground`}>
            <li><strong>知る</strong>: ランキング・チャート・地図で「統計って面白い」と気づく</li>
            <li><strong>理解する</strong>: 調査の仕組み・データの読み方を学ぶ（note 連携）</li>
            <li><strong>活用する</strong>: 加工済みデータで仕事や意思決定に使う</li>
          </ul>
        </AboutSection>

        {/* 3. データソース・編集方針 */}
        <AboutSection title="データソース・編集方針">
          <div className="flex items-start gap-2 mb-4">
            <Briefcase className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold mb-1">一次統計データのみ使用</p>
              <p className="text-xs text-muted-foreground">
                総務省・厚生労働省・各省庁が公開する公的統計
              </p>
            </div>
          </div>
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 flex-shrink-0">主要データソース</span>
              <a
                href={EXTERNAL_LINKS.eStat}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1"
              >
                <Badge variant="secondary" className="text-xs font-normal">
                  e-Stat（政府統計の総合窓口）
                </Badge>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 flex-shrink-0">データ鮮度</span>
              <Badge variant="outline" className="text-xs font-normal">
                公開後 24 時間以内に反映（自動化）
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 flex-shrink-0">出典明示</span>
              <Badge variant="outline" className="text-xs font-normal">
                全記事末尾に一次情報リンク
              </Badge>
            </div>
          </div>
          <Separator className="my-4" />
          <p className="text-xs font-semibold mb-2">編集 6 原則</p>
          <ol className={`${TEXT_STYLE} list-decimal pl-5 space-y-1 text-muted-foreground`}>
            <li><strong>わかりやすさ</strong>: 専門知識ゼロでも楽しめる入口を</li>
            <li><strong>信頼性</strong>: 一次統計に基づく正確な数値と出典の明示</li>
            <li><strong>中立性</strong>: 「不都合な真実」も隠さない客観的提示</li>
            <li><strong>無料アクセス</strong>: 基本データは永続的に無料</li>
            <li><strong>経験知</strong>: 統計の現場を知るからこそ書ける「読み方」</li>
            <li><strong>活用支援</strong>: 「見て終わり」で終わらせない</li>
          </ol>
        </AboutSection>

        {/* 4. お問い合わせ・規約 */}
        <AboutSection title="お問い合わせ・規約">
          <p className={TEXT_STYLE_WITH_MARGIN}>
            データの誤りの指摘、統計の読み解き方のご質問、コラボレーションのご提案などはお問い合わせフォームからお寄せください。
          </p>
          <div className="flex flex-col gap-2">
            <a href={EXTERNAL_LINKS.contactForm} target="_blank" rel="noopener noreferrer">
              <Button variant="default" size="sm" className="w-full gap-2">
                <span className="text-xs">お問い合わせフォーム</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </a>
            <a href="/privacy">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <span className="text-xs">プライバシーポリシー</span>
              </Button>
            </a>
            <a href="/terms">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <span className="text-xs">利用規約</span>
              </Button>
            </a>
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            サービス開始: 2024 年 10 月 / 運営: KAZU（個人） / 所在: 東京都
          </p>
        </AboutSection>
      </div>
    </main>
  );
}
