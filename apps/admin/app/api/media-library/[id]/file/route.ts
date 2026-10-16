import sharp from 'sharp';
import { imageBytes } from '@/lib/server/content-quality';
import { workspaceError } from '@/lib/server/workspace-request';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params,
      url = new URL(req.url),
      input = url.searchParams.get('input') === '1';
    const value = await imageBytes(
      id,
      url.searchParams.get('revision') ?? 'original',
      input
    );
    const types: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.json': 'application/json',
    };
    // Never serve active SVG documents; rasterize the verified image.
    const bytes =
      value.mime === '.svg'
        ? await sharp(value.bytes, { limitInputPixels: 40_000_000 })
            .png()
            .toBuffer()
        : value.bytes;
    return new Response(new Uint8Array(bytes), {
      headers: {
        'content-type':
          value.mime === '.svg'
            ? 'image/png'
            : (types[value.mime] ?? 'application/octet-stream'),
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        'content-security-policy': "default-src 'none'; sandbox",
        ...(input
          ? {
              'content-disposition':
                'attachment; filename="generation-input.json"',
            }
          : {}),
      },
    });
  } catch (e) {
    return workspaceError(e);
  }
}
