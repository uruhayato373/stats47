#!/usr/bin/env node
/** Verify the persistent macOS note profile without opening an editor. */
import { assertAccount, launchContext, pruneProfileCaches } from "../../../packages/ops/src/note/lib/note-session.mjs";

const context = await launchContext();
try {
  const account = await assertAccount(context);
  console.log(JSON.stringify({ loggedIn: true, account, profile: ".local/playwright-note-profile" }));
} finally {
  await context.close();
  pruneProfileCaches();
}
