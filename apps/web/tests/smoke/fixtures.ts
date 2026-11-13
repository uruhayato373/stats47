import { test as base } from '@playwright/test';

import { AD_REQUESTS, ANALYTICS_REQUESTS } from './network-policy';

export { expect, type Page } from '@playwright/test';

export const test = base.extend<{ allowAds: boolean }>({
  allowAds: [false, { option: true }],
  context: async ({ context, allowAds }, runTest) => {
    // Automated navigation must not become GA4 traffic or trigger vignette ads.
    await context.route(ANALYTICS_REQUESTS, route => route.abort('blockedbyclient'));
    if (!allowAds) {
      await context.route(AD_REQUESTS, route => route.abort('blockedbyclient'));
    }
    await runTest(context);
  },
});
