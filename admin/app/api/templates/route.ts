import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, s3, TABLE_NAME, BUCKET_NAME, CLOUDFRONT_DOMAIN } from "@/lib/aws";

export async function GET() {
  try {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "SK = :sk",
        ExpressionAttributeValues: { ":sk": "META" },
        Limit: 500,
      })
    );
    return NextResponse.json({ success: true, data: result.Items || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const schemaFile = formData.get("schema") as File;
    const thumbnailFile = formData.get("thumbnail") as File;
    const category = formData.get("category") as string;
    const subcategory = formData.get("subcategory") as string;
    const language = formData.get("language") as string;
    const premium = formData.get("premium") === "true";
    const tagsRaw = formData.get("tags") as string;
    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : [];
    const scheduledDate = formData.get("scheduled_date") as string | null;

    if (!schemaFile || !thumbnailFile || !category || !language) {
      return NextResponse.json(
        { success: false, error: "schema, thumbnail, category, and language are required" },
        { status: 400 }
      );
    }

    // Parse template JSON to get ID
    const schemaText = await schemaFile.text();
    let schema: Record<string, unknown>;
    try {
      schema = JSON.parse(schemaText);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in schema file" },
        { status: 400 }
      );
    }
    const templateId = (schema.id as string) || `${category}_${Date.now()}`;

    // Upload schema JSON to S3
    const schemaKey = `templates/${templateId}/schema.json`;
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: schemaKey,
        Body: schemaText,
        ContentType: "application/json",
      })
    );

    // Upload thumbnail to S3
    const thumbnailExt = thumbnailFile.name.split(".").pop() || "webp";
    const thumbnailKey = `templates/${templateId}/thumbnail.${thumbnailExt}`;
    const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: thumbnailFile.type,
      })
    );

    if (!CLOUDFRONT_DOMAIN) {
      return NextResponse.json(
        { success: false, error: "CLOUDFRONT_DOMAIN not configured" },
        { status: 500 }
      );
    }

    // Insert metadata into DynamoDB
    const item: Record<string, unknown> = {
      PK: `TEMPLATE#${templateId}`,
      SK: "META",
      category,
      subcategory: subcategory || category,
      language,
      premium,
      tags,
      tags_str: tags.join(","),
      schema_url: `https://${CLOUDFRONT_DOMAIN}/${schemaKey}`,
      thumbnail_url: `https://${CLOUDFRONT_DOMAIN}/${thumbnailKey}`,
      created_at: Date.now(),
    };

    if (scheduledDate) {
      item.scheduled_date = scheduledDate;
    }

    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return NextResponse.json({ success: true, data: { id: templateId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
