import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

export const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

export const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
});

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "poster-app";
export const BUCKET_NAME =
  process.env.S3_BUCKET_NAME || "poster-app-assets-techveda";
export const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || "";
