import type { S3Client } from "@aws-sdk/client-s3";
export function createR2S3Client(options?: { bucket?: string }): S3Client;
