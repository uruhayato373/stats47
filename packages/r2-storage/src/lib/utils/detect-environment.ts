export function detectEnvironment() {
  const isDevelopment = process.env.NODE_ENV === "development";

  const hasS3Credentials = !!(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_S3_ENDPOINT
  );

  const isCloudflareWorkers = !isDevelopment && !hasS3Credentials;

  return {
    isDevelopment,
    hasS3Credentials,
    isCloudflareWorkers,
  };
}
