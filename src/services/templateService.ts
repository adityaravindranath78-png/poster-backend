import {
  GetCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME } from "../config/dynamodb.js";
import { TemplateMeta } from "../types/index.js";

function parseNextKey(nextKey: string | undefined): Record<string, unknown> | undefined {
  if (!nextKey) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(nextKey, "base64url").toString());
    if (typeof parsed !== "object" || parsed === null) return undefined;
    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function encodeNextKey(key: Record<string, unknown> | undefined): string | undefined {
  if (!key) return undefined;
  return Buffer.from(JSON.stringify(key)).toString("base64url");
}

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
      ExclusiveStartKey: parseNextKey(nextKey),
    })
  );

  return {
    items: (result.Items || []).map(mapToTemplateMeta),
    nextKey: encodeNextKey(result.LastEvaluatedKey),
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
      ExclusiveStartKey: parseNextKey(nextKey),
    })
  );

  return {
    items: (result.Items || []).map(mapToTemplateMeta),
    nextKey: encodeNextKey(result.LastEvaluatedKey),
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

  const items: Record<string, unknown>[] = [];
  let exclusiveStartKey = parseNextKey(nextKey);
  let tableExhausted = false;
  let pagesScanned = 0;
  const MAX_SCAN_PAGES = 10; // Safety cap — prevents runaway scans on large tables

  // Paginate internally until we have enough items or exhaust the table.
  // DynamoDB Scan Limit caps items *evaluated* (pre-filter), not items *returned*.
  while (items.length < limit && pagesScanned < MAX_SCAN_PAGES) {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: filterParts.join(" AND "),
        ExpressionAttributeValues: values,
        ...(Object.keys(names).length > 0 && {
          ExpressionAttributeNames: names,
        }),
        Limit: limit * 3,
        ExclusiveStartKey: exclusiveStartKey,
      })
    );

    items.push(...(result.Items || []));
    exclusiveStartKey = result.LastEvaluatedKey;
    pagesScanned++;

    if (!exclusiveStartKey) {
      tableExhausted = true;
      break;
    }
  }

  // Return exactly `limit` items. Only provide nextKey if there's more to read.
  // Since Scan doesn't let us resume at an arbitrary item offset, we can only
  // provide a nextKey when we stopped exactly at a DynamoDB page boundary.
  const hasMore = !tableExhausted && items.length >= limit;

  return {
    items: items.slice(0, limit).map(mapToTemplateMeta),
    nextKey: hasMore ? encodeNextKey(exclusiveStartKey) : undefined,
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

  const values: Record<string, unknown> = { ":date": today };
  const names: Record<string, string> = {};
  let filterExpression: string | undefined;

  if (language) {
    filterExpression = "#lang = :lang";
    names["#lang"] = "language";
    values[":lang"] = language;
  }

  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "scheduled-date-index",
      KeyConditionExpression: "scheduled_date = :date",
      ExpressionAttributeValues: values,
      ...(filterExpression && { FilterExpression: filterExpression }),
      ...(Object.keys(names).length > 0 && { ExpressionAttributeNames: names }),
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

  // Match any word against tags_str or category/subcategory
  words.forEach((word, i) => {
    filterParts.push(
      `(contains(#tags_str, :w${i}) OR contains(category, :w${i}) OR contains(subcategory, :w${i}))`
    );
    values[`:w${i}`] = word;
  });

  // Paginate scan internally to get enough results
  const items: Record<string, unknown>[] = [];
  const maxLimit = Math.min(limit, 50);
  let exclusiveStartKey: Record<string, unknown> | undefined;
  let pagesScanned = 0;
  const MAX_SCAN_PAGES = 10; // Safety cap

  while (items.length < maxLimit && pagesScanned < MAX_SCAN_PAGES) {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: filterParts.join(" AND "),
        ExpressionAttributeNames: { "#tags_str": "tags_str" },
        ExpressionAttributeValues: values,
        Limit: maxLimit * 3,
        ExclusiveStartKey: exclusiveStartKey,
      })
    );

    items.push(...(result.Items || []));
    exclusiveStartKey = result.LastEvaluatedKey;
    pagesScanned++;

    if (!exclusiveStartKey) break;
  }

  return { items: items.slice(0, maxLimit).map(mapToTemplateMeta) };
}

function mapToTemplateMeta(item: Record<string, unknown>): TemplateMeta {
  const pk = item.PK as string;
  const id = pk.startsWith("TEMPLATE#") ? pk.slice(9) : (item.template_id as string) || pk;

  // Handle tags from both List (array) and Set (DynamoDB SS → JS Set)
  let tags: string[] = [];
  if (Array.isArray(item.tags)) {
    tags = item.tags as string[];
  } else if (item.tags instanceof Set) {
    tags = [...item.tags] as string[];
  }

  return {
    id,
    category: (item.category as string) || "",
    subcategory: (item.subcategory as string) || "",
    language: (item.language as string) || "en",
    premium: (item.premium as boolean) ?? (item.is_premium as boolean) ?? false,
    tags,
    schema_url: (item.schema_url as string) || (item.template_url as string) || "",
    thumbnail_url: (item.thumbnail_url as string) || "",
    created_at: (item.created_at as number) || 0,
    scheduled_date: item.scheduled_date as string | undefined,
  };
}
