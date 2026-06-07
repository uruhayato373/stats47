import { deleteMultipleFromR2, listFromR2 } from "../lib/index";
import { assertR2WriteAllowed } from "./_assert-ci-write";

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  if (!DRY_RUN) {
    assertR2WriteAllowed({ op: "delete-r2-per-household (R2 削除)" });
  }

  console.log("Listing app/ranking/ keys...");
  const all = await listFromR2("app/ranking/");
  const targets = all.filter((k) => k.endsWith("values-per_household.json"));

  console.log(`Found: ${targets.length} files`);
  targets.slice(0, 20).forEach((k) => console.log(` - ${k}`));
  if (targets.length > 20) console.log(` ... and ${targets.length - 20} more`);

  if (DRY_RUN) {
    console.log("DRY RUN — skipping deletion. Re-run without --dry-run to delete.");
    return;
  }

  if (targets.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  console.log("Deleting...");
  const { deleted, errors } = await deleteMultipleFromR2(targets);
  console.log(`Deleted: ${deleted.length}`);

  if (errors.length > 0) {
    console.error(`Errors: ${errors.length}`);
    errors.forEach((e) => console.error(` - ${e.key}: ${e.message}`));
    process.exit(1);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
