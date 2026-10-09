/**
 * SNS 投稿の素材 (画像・動画) の実体を置く Google Drive の場所と、保全・照合の共通処理。
 *   Drive (非公開・正本): stats47/SNS素材/<platform>/<id>/<role>-<order>.<ext>
 *   台帳 (git): posts.json の行の assets[] に drive_path (stats47 起点の相対パス)・sha256・bytes だけを書く。
 *   R2 sns/ と .local/r2/sns は投稿のための配信・作業コピー (R2 の mp4 は投稿 30 日後に消える)。
 * マウント解決は参考資料 vault (source-vault) と同じ実装。マウントが無い PC では例外 (別の場所へ黙って落とさない)。
 * Drive の fileId・URL・端末のマウント先は台帳に書かない (.claude/rules/reference-source-standards.md と同じ契約)。
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, copyFileSync, statSync } from "node:fs";
import { dirname, extname, resolve, sep } from "node:path";
import { resolveVaultRoot } from "../../source-vault/source-vault.mjs";

export const DRIVE_SNS_FOLDER = "SNS素材";

const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
};

export function mimeOf(file) {
  return MIME_BY_EXT[extname(file).toLowerCase()] ?? null;
}

/** Drive 上の stats47 フォルダ (絶対パス)。マウントが無ければ例外 */
export async function resolveDriveRoot() {
  return resolveVaultRoot().root;
}

export function assetFileName(role, order, ext) {
  return `${role}-${order}${ext.toLowerCase()}`;
}

export function driveRelPath(platform, id, fileName) {
  return `${DRIVE_SNS_FOLDER}/${platform}/${id}/${fileName}`;
}

/** 台帳の drive_path を絶対パスへ。SNS素材/ の外を指すものは拒否する */
export function driveAbsolutePath(driveRoot, drivePath) {
  const base = resolve(driveRoot, DRIVE_SNS_FOLDER);
  const abs = resolve(driveRoot, drivePath);
  if (!abs.startsWith(base + sep)) throw new Error(`SNS素材/ の外を指す drive_path: ${drivePath}`);
  return abs;
}

export function sha256File(file) {
  return new Promise((done, fail) => {
    const hash = createHash("sha256");
    const stream = createReadStream(file);
    stream.on("error", fail);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => done(hash.digest("hex")));
  });
}

async function imageSize(file) {
  try {
    const { default: sharp } = await import(/* webpackIgnore: true */ "sharp");
    const { width, height } = await sharp(file).metadata();
    return width && height ? { width, height } : {};
  } catch {
    return {};
  }
}

/**
 * ローカルの素材ファイルを Drive へ保全し、台帳の assets[] に入れる 1 件を返す。
 * 同じ sha256 の実体が既にあれば複製しない (冪等)。複製後は読み戻して sha256 を照合する。
 */
export async function archiveFile({ driveRoot, platform, id, role, order, sourceFile, source }) {
  const mime = mimeOf(sourceFile);
  if (!mime) throw new Error(`素材の種類を判定できません: ${sourceFile}`);
  const sha256 = await sha256File(sourceFile);
  const drivePath = driveRelPath(platform, id, assetFileName(role, order, extname(sourceFile)));
  const target = driveAbsolutePath(driveRoot, drivePath);
  const already = existsSync(target) && (await sha256File(target)) === sha256;
  if (!already) {
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(sourceFile, target);
    const readBack = await sha256File(target);
    if (readBack !== sha256) throw new Error(`Drive への複製後の sha256 が一致しません: ${drivePath}`);
  }
  const size = mime.startsWith("image/") ? await imageSize(sourceFile) : {};
  return {
    role,
    order,
    state: "archived",
    drive_path: drivePath,
    sha256,
    bytes: statSync(sourceFile).size,
    mime,
    ...size,
    source: source ?? null,
  };
}

/** 台帳の archived 素材が Drive に実在し sha256 が一致するかを照合する (Mac 上の検査用) */
export async function verifyArchivedAssets(posts) {
  const targets = posts.flatMap((row) =>
    (row.assets ?? []).filter((a) => a.state === "archived").map((a) => ({ row, asset: a })),
  );
  if (!targets.length) return { checked: 0, errors: [] };
  const driveRoot = await resolveDriveRoot();
  const errors = [];
  for (const { row, asset } of targets) {
    const abs = driveAbsolutePath(driveRoot, asset.drive_path);
    if (!existsSync(abs)) errors.push(`id=${row.id}: Drive に素材がありません ${asset.drive_path}`);
    else if ((await sha256File(abs)) !== asset.sha256) errors.push(`id=${row.id}: Drive の素材の sha256 が台帳と違います ${asset.drive_path}`);
  }
  return { checked: targets.length, errors };
}
