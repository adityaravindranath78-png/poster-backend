import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, BUCKET_NAME, CLOUDFRONT_DOMAIN } from "../config/s3.js";

export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<{ uploadUrl: string; fileUrl: string }> {
  if (!CLOUDFRONT_DOMAIN) {
    throw new Error("CLOUDFRONT_DOMAIN is required — direct S3 URLs are blocked");
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const fileUrl = `https://${CLOUDFRONT_DOMAIN}/${key}`;

  return { uploadUrl, fileUrl };
}
