import { config } from "dotenv";
import path from "path";
import { createInterface } from "readline";
import { deleteMultipleFromR2, listFromR2 } from "../lib/index";

// 環境変数をロード（モノレポルートの .env.local）
config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

async function main() {
  const args = process.argv.slice(2);
  const prefix = args[0];

  if (!prefix) {
    console.error("Usage: npx tsx scripts/delete-r2-prefix.ts <prefix>");
    process.exit(1);
  }

  if (!prefix.endsWith("/")) {
    console.warn("Warning: Prefix does not end with '/'. This might match unintended files.");
  }

  console.log(`Listing files with prefix: "${prefix}"...`);

  try {
    const keys = await listFromR2(prefix);

    if (keys.length === 0) {
      console.log("No files found.");
      return;
    }

    console.log(`Found ${keys.length} files.`);
    console.log("Example files:");
    keys.slice(0, 5).forEach((key) => console.log(` - ${key}`));
    if (keys.length > 5) console.log(" ...");

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question(
        `Are you sure you want to DELETE these ${keys.length} files? Type "yes" to confirm: `,
        resolve
      );
    });

    rl.close();

    if (answer !== "yes") {
      console.log("Aborted.");
      return;
    }

    console.log("Deleting files...");
    const { deleted, errors } = await deleteMultipleFromR2(keys);

    console.log(`Deleted: ${deleted.length}`);
    if (errors.length > 0) {
      console.error(`Errors: ${errors.length}`);
      errors.slice(0, 5).forEach((e) => console.error(` - ${e.key}: ${e.message}`));
      if (errors.length > 5) console.error(" ...");
    }

    console.log("Done.");
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

main();
