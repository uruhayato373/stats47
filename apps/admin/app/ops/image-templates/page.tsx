import { ImageTemplateWorkspace } from '@/components/content/image-template-workspace';
import { qualityOverview } from '@/lib/server/content-quality';
import { templateSamplePool } from '@/lib/media-template-examples';

export const dynamic = 'force-dynamic';
export const metadata = { title: '型の見本 — stats47 admin' };

export default function Page() {
  const { images, templates } = qualityOverview();
  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-[520px] flex-col gap-3 md:h-[calc(100dvh-4rem)]">
      <header>
        <h1 className="text-2xl font-bold">型の見本</h1>
        <p className="text-sm text-console-muted">
          型と媒体を選び、実画像を確認して制作方針を整えます。
        </p>
      </header>
      <ImageTemplateWorkspace
        initial={{ ...templateSamplePool(images), templates }}
      />
    </div>
  );
}
