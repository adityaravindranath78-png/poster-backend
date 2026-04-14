import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.js";

export const s3 = new S3Client({ region: env.AWS_REGION });
export const BUCKET_NAME = env.S3_BUCKET;
export const CLOUDFRONT_DOMAIN = env.CLOUDFRONT_DOMAIN;
