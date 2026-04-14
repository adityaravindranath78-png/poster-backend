import {
  GetCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME } from "../config/dynamodb.js";
import { TemplateMeta } from "../types/index.js";

export async function getTemplates(params: {
  category?: string;
  language?: string;
  limit?: number;
  nextKey?: string;
}): Promise<{ items: TemplateMeta[]; nextKey?: string }> {
  const limit = Math.min(params.limit || 20, 50);

  // If both category and language, use GSI
  if (params.category && params.language) {
    return queryByCategoryLanguage(
      params.category,
      params.language,
      limit,
      params.nextKey
    );
  }

  // If only category, query GSI with just the partition key
  if (params.category) {
    return queryByCategory(params.category, limit, params.nextKey);
  }

  // Fallback: scan with filter
  return scanTemplates(params.language, limit, params.nextKey);
}

async function queryByCategoryLanguage(
  category: string,
  language: string,
  limit: number,
  nextKey?: string
): Promise<{ items: TemplateMeta[]; nextKey?: string }> {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "category-language-index",
      KeyConditionExpression: "category = :cat AND #lang = :lang",
      ExpressionAttributeNames: { "#lang": "language" },
      ExpressionAttributeValues: { ":cat": category, ":lang": language },
      Limit: limit,
      ExclusiveStartKey: nextKey ? JSON.parse(Buffer.from(nextKey, "base64url").toString()) : undefined,
    })
  );

  return {
    items: (result.Items || []).map(mapToTemplateMeta),
    nextKey: result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64url")
      : undefined,
  };
}

async function queryByCategory(
  category: string,
  limit: number,
  nextKey?: string
): Promise<{ items: TemplateMeta[]; nextKey?: string }> {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "category-language-index",
      KeyConditionExpression: "category = :cat",
      ExpressionAttributeValues: { ":cat": category },
      Limit: limit,
      ExclusiveStartKey: nextKey ? JSON.parse(Buffer.from(nextKey, "base64url").toString()) : undefined,
    })
  );

  return {
    items: (result.Items || []).map(mapToTemplateMeta),
    nextKey: result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64url")
      : undefined,
  };
}

async function scanTemplates(
  language: string | undefined,
  limit: number,
  nextKey?: string
): Promise<{ items: TemplateMeta[]; nextKey?: string }> {
  const filterParts: string[] = ["SK = :sk"];
  const values: Record<string, unknown> = { ":sk": "META" };
  const names: Record<string, string> = {};

  if (language) {
    filterParts.push("#lang = :lang");
    names["#lang"] = "language";
    values[":lang"] = language;
  }

  const result = await dynamodb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: filterParts.join(" AND "),
      ExpressionAttributeValues: values,
      ...(Object.keys(names).length > 0 && {
        ExpressionAttributeNames: names,
      }),
      Limit: limit,
      ExclusiveStartKey: nextKey ? JSON.parse(Buffer.from(nextKey, "base64url").toString()) : undefined,
    })
  );

  return {
    items: (result.Items || []).map(mapToTemplateMeta),
    nextKey: result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64url")
      : undefined,
  };
}

export async function getTemplateById(
  id: string
): Promise<TemplateMeta | null> {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `TEMPLATE#${id}`, SK: "META" },
    })
  );

  if (!result.Item) return null;
  return mapToTemplateMeta(result.Item);
}

export async function getDailyTemplates(
  language?: string
): Promise<{ items: TemplateMeta[] }> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "scheduled-date-index",
      KeyConditionExpression: "scheduled_date = :date",
      ExpressionAttributeValues: { ":date": today },
      ...(language && {
        FilterExpression: "#lang = :lang",
        ExpressionAttributeNames: { "#lang": "language" },
        ExpressionAttributeValues: {
          ":date": today,
          ":lang": language,
        },
      }),
    })
  );

  return { items: (result.Items || []).map(mapToTemplateMeta) };
}

export async function searchTemplates(
  query: string,
  limit: number
): Promise<{ items: TemplateMeta[] }> {
  // DynamoDB doesn't support full-text search natively.
  // Scan with contains filter on tags. For production, use OpenSearch.
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { items: [] };

  const filterParts: string[] = ["SK = :sk"];
  const values: Record<string, unknown> = { ":sk": "META" };

  // Match any word against tags (joined as string) or category/subcategory
  words.forEach((word, i) => {
    filterParts.push(
      `(contains(#tags_str, :w${i}) OR contains(category, :w${i}) OR contains(subcategory, :w${i}))`
    );
    values[`:w${i}`] = word;
  });

  const result = await dynamodb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: filterParts.join(" AND "),
      ExpressionAttributeNames: { "#tags_str": "tags_str" },
      ExpressionAttributeValues: values,
      Limit: Math.min(limit, 50),
    })
  );

  return { items: (result.Items || []).map(mapToTemplateMeta) };
}

function mapToTemplateMeta(item: Record<string, unknown>): TemplateMeta {
  const pk = item.PK as string;
  const id = pk.startsWith("TEMPLATE#") ? pk.slice(9) : (item.template_id as string) || pk;

  return {
    id,
    category: (item.category as string) || "",
    subcategory: (item.subcategory as string) || "",
    language: (item.language as string) || "en",
    premium: (item.premium as boolean) ?? (item.is_premium as boolean) ?? false,
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    schema_url: (item.schema_url as string) || (item.template_url as string) || "",
    thumbnail_url: (item.thumbnail_url as string) || "",
    created_at: (item.created_at as number) || 0,
    scheduled_date: item.scheduled_date as string | undefined,
  };
}
