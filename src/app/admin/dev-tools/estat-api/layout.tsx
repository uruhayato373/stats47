import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/atoms/ui/resizable";

/**
 * EstatApi共通レイアウトのProps型定義
 */
interface EstatApiLayoutProps {
  main: React.ReactNode;
  sidebar: React.ReactNode;
}

/**
 * EstatApi共通レイアウトコンポーネント
 *
 * 各ページで共通のResizableレイアウトを提供し、
 * メインコンテンツとサイドバーを配置します。
 *
 * @param main - メインコンテンツスロット
 * @param sidebar - サイドバースロット
 */
export default function EstatApiLayout({
  main,
  sidebar,
}: EstatApiLayoutProps) {
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      {/* メインコンテンツエリア */}
      <ResizablePanel defaultSize={70} minSize={50}>
        <div className="h-full overflow-auto">{main}</div>
      </ResizablePanel>

      {/* リサイズハンドル */}
      <ResizableHandle />

      {/* サイドバー（右側） */}
      <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
        <div className="h-full overflow-auto bg-gray-50 dark:bg-neutral-900 border-l border-border">
          {sidebar}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

