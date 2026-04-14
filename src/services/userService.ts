import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME } from "../config/dynamodb.js";
import { UserProfile } from "../types/index.js";

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
    })
  );

  if (!result.Item) return null;

  return mapItemToProfile(userId, result.Item);
}

export async function createOrUpdateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  // Atomic upsert — no read-then-write race condition.
  // UpdateCommand creates the item if it doesn't exist.
  const fieldMap: Record<string, string> = {
    name: "name",
    phone: "phone",
    photoUrl: "photo_url",
    businessName: "business_name",
    logoUrl: "logo_url",
    language: "language",
  };

  const expParts: string[] = ["#updated_at = :updated_at"];
  const names: Record<string, string> = { "#updated_at": "updated_at" };
  const values: Record<string, unknown> = { ":updated_at": Date.now() };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    const val = updates[key as keyof typeof updates];
    if (val !== undefined) {
      const placeholder = `:${dbField}`;
      const nameAlias = `#${dbField}`;
      expParts.push(`${nameAlias} = ${placeholder}`);
      names[nameAlias] = dbField;
      values[placeholder] = val;
    }
  }

  // SET defaults only if the item is new (if_not_exists is a no-op on existing attrs).
  // Only add defaults for fields that weren't explicitly provided in this update,
  // otherwise DynamoDB errors with "Two document paths overlap".
  expParts.push(
    "#sub_status = if_not_exists(#sub_status, :free)",
    "#created_at = if_not_exists(#created_at, :now)"
  );
  names["#sub_status"] = "subscription_status";
  names["#created_at"] = "created_at";
  values[":free"] = "free";
  values[":now"] = Date.now();

  if (updates.language === undefined) {
    expParts.push("#lang_default = if_not_exists(#lang_default, :default_lang)");
    names["#lang_default"] = "language";
    values[":default_lang"] = "en";
  }

  if (updates.name === undefined) {
    expParts.push("#name_default = if_not_exists(#name_default, :empty)");
    names["#name_default"] = "name";
    values[":empty"] = "";
  }

  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
      UpdateExpression: `SET ${expParts.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );

  return mapItemToProfile(userId, result.Attributes!);
}

function mapItemToProfile(
  userId: string,
  item: Record<string, unknown>
): UserProfile {
  return {
    userId,
    name: (item.name as string) || "",
    phone: item.phone as string | undefined,
    photoUrl: item.photo_url as string | undefined,
    businessName: item.business_name as string | undefined,
    logoUrl: item.logo_url as string | undefined,
    language: (item.language as string) || "en",
    subscriptionStatus:
      (item.subscription_status as "free" | "premium" | "business") || "free",
    subscriptionExpiry: item.subscription_expiry as number | undefined,
  };
}
