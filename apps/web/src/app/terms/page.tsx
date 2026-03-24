/**
 * 利用規約ページ
 *
 * 利用規約を表示する静的ページです。
 * サービス利用条件、禁止事項、免責事項などを説明します。
 */

import { generateOGMetadata } from "@/lib/metadata/og-generator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import type { Metadata } from "next";

const title = "利用規約 | 統計で見る都道府県";
const description =
  "統計で見る都道府県（stats47）の利用規約。サービス利用条件、禁止事項、免責事項などを説明します。";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/terms",
  },
  ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
};

/**
 * 利用規約ページコンポーネント
 *
 * @returns 利用規約ページのJSX要素
 */
export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">利用規約</h1>
        <p className="text-muted-foreground leading-relaxed">
          本規約は、統計で見る都道府県（stats47、以下「当サービス」）の提供するサービスの利用条件を定めるものです。利用者は、本規約に同意の上、当サービスを利用するものとします。
        </p>
      </div>

      <div className="space-y-6">
        {/* 第1条（適用） */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">第1条（適用）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                本規約は、当サービスの提供するすべてのサービス（ウェブサイト、API、その他関連サービスを含む）の利用条件を定めるものです。
                利用者は、本規約に同意の上、当サービスを利用するものとします。
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                当サービスは、利用者が本規約に同意しない場合、当サービスの利用を認めないことがあります。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 第2条（定義） */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">第2条（定義）</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground list-disc pl-5">
              <li>
                <span className="font-semibold text-foreground">「当サービス」</span>
                とは、統計で見る都道府県（stats47）およびその関連サービスを指します。
              </li>
              <li>
                <span className="font-semibold text-foreground">「運営者」</span>
                とは、当サービスを運営するヤマモト ヒロシを指します。
              </li>
              <li>
                <span className="font-semibold text-foreground">「利用者」</span>
                とは、当サービスを利用するすべての個人・法人を指します。
              </li>
              <li>
                <span className="font-semibold text-foreground">「コンテンツ」</span>
                とは、当サービス上に表示されるすべての情報（テキスト、画像、グラフ、データなど）を指します。
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 第3条（利用規約の変更） */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">第3条（利用規約の変更）</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              当サービスは、必要に応じて本規約の内容を変更することがあります。
              変更後の規約は、当ページに掲載した時点より効力を生じるものとします。
              利用者は、定期的に本規約を確認し、変更内容を把握するものとします。
            </p>
          </CardContent>
        </Card>

        {/* 第4条（サービスの内容） */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">第4条（サービスの内容）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                当サービスは、日本の地域統計データを可視化し、提供するサービスです。
                主な機能は以下の通りです。
              </p>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground list-disc pl-5">
                <li>
                  47都道府県の統計データの可視化（グラフ、チャート、地図など）
                </li>
                <li>地域間の比較機能</li>
                <li>時系列データの表示</li>
                <li>統計データに関するブログ記事の提供</li>
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground">
                当サービスは、予告なくサービスの内容を変更、追加、削除することがあります。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 第5条（利用者の責任） */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">第5条（利用者の責任）</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed mb-4 text-muted-foreground">
              利用者は、当サービスの利用にあたり、以下の責任を負うものとします。
            </p>
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground list-disc pl-5">
              <li>利用者自身の責任において当サービスを利用すること</li>
              <li>利用者自身の判断に基づいて当サービスを利用すること</li>
              <li>
                当サービスの利用により生じた結果について、利用者自身が責任を負うこと
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 第6条（禁止事項） */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">第6条（禁止事項）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                利用者は、当サービスの利用にあたり、以下の行為を行ってはなりません。
              </p>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground list-disc pl-5">
                <li>法令または公序良俗に反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>当サービスの運営を妨害する行為</li>
                <li>
                  当サービスのサーバーまたはネットワークに不正にアクセスする行為
                </li>
                <li>
                  当サービスのコンテンツを無断で複製、転載、改変する行為
                </li>
                <li>
                  他者の権利（著作権、肖像権、プライバシー権など）を侵害する行為
                </li>
                <li>他者に成りすます行為</li>
                <li>
                  当サービスの他の利用者または第三者に不利益、損害、不快感を与える行為
                </li>
                <li>
                  当サービスに関連して、反社会的勢力等に利益を提供する行為
                </li>
                <li>その他、当サービスが不適切と判断する行為</li>
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground">
                利用者が前項の禁止事項に該当する行為を行った場合、当サービスは、利用者に事前に通知することなく、
                当サービスの利用を停止または制限し、または利用者のアカウントを削除することができます。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 第7条（知的財産権） */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">第7条（知的財産権）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                当サービスに含まれるコンテンツ（テキスト、画像、グラフ、データ、デザインなど）の知的財産権は、
                当サービスまたは正当な権利者に帰属します。
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                利用者は、当サービスのコンテンツを、当サービスの利用目的の範囲内でのみ使用することができます。
                当サービスのコンテンツを無断で複製、転載、改変、配布することは禁止されています。
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                当サービスで使用されている統計データは、政府統計（e-Stat）などの公的データに基づいています。
                これらのデータの利用については、各データ提供者の利用規約に従うものとします。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 第8条（免責事項） */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">第8条（免責事項）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                当サービスは、以下の事項について一切の責任を負いません。
              </p>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground list-disc pl-5">
                <li>
                  当サービスが提供する情報の正確性、完全性、有用性、最新性についての保証
                </li>
                <li>
                  当サービスの利用により生じた利用者の損害（直接損害、間接損害、特別損害、結果的損害を含む）
                </li>
                <li>
                  当サービスの利用により生じた利用者と第三者との間の紛争
                </li>
                <li>
                  当サービスの中断、停止、終了、データの消失、機器の故障などにより生じた損害
                </li>
                <li>
                  当サービスへの不正アクセス、コンピュータウイルスの感染などにより生じた損害
                </li>
                <li>
                  当サービスが提供する統計データの解釈や利用方法に関する判断
                </li>
                <li>その他、当サービスの利用に関連して生じた一切の損害</li>
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground">
                当サービスは、利用者が当サービスを利用して行った判断や行動について、一切の責任を負いません。
                利用者は、当サービスの利用にあたり、自己の責任において判断し、行動するものとします。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 第9条（サービスの中断・停止） */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">第9条（サービスの中断・停止）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                当サービスは、以下の場合、事前に通知することなく、当サービスの全部または一部を中断または停止することがあります。
              </p>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground list-disc pl-5">
                <li>システムのメンテナンスまたは更新を行う場合</li>
                <li>
                  天災、戦争、暴動、労働争議などの不可抗力により、当サービスの運営が困難になった場合
                </li>
                <li>その他、当サービスがやむを得ないと判断した場合</li>
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground">
                当サービスは、前項の事由により生じた利用者の損害について、一切の責任を負いません。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 第10条（準拠法・管轄裁判所） */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">第10条（準拠法・管轄裁判所）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                本規約は、日本法を準拠法とします。
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                本規約に関して生じた紛争については、当サービス運営者の所在地（東京都）を管轄する裁判所を第一審の専属的合意管轄とします。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 第11条（お問い合わせ） */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">第11条（お問い合わせ）</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed mb-4 text-muted-foreground">
              本規約に関するお問い合わせは、以下のGoogleフォームよりお願いいたします。
            </p>
            <p>
              <a
                href="https://forms.gle/ZYi7Rmk4Kt9qZCXB8"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium text-sm"
              >
                お問い合わせフォーム
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
