// Host boundaries keep first-party data/images and similarly named hosts untouched.
export const AD_REQUESTS = /^https?:\/\/(?:[^/]+\.)?(?:googlesyndication\.com|doubleclick\.net|googleadservices\.com)(?::\d+)?\//i;
export const ANALYTICS_REQUESTS = /^https?:\/\/(?:[^/]+\.)?(?:google-analytics\.com|googletagmanager\.com)(?::\d+)?\//i;
