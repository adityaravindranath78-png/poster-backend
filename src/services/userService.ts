import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
  const existing = await getUserProfile(userId);

  if (!existing) {
    // Create new profile
    const item: Record<string, unknown> = {
      PK: `USER#${userId}`,
      SK: "PROFILE",
      name: updates.name || "",
      phone: updates.phone,
      photo_url: updates.photoUrl,
      business_name: updates.businessName,
      logo_url: updates.logoUrl,
      language: updates.language || "en",
      subscription_status: "free",
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    await dynamodb.send(
      new PutCommand({ TableName: TABLE_NAME, Item: item })
    );

    return mapItemToProfile(userId, item);
  }

  // Build update expression dynamically
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
