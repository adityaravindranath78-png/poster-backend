import Link from "next/link";
import { dynamodb, TABLE_NAME } from "@/lib/aws";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

interface TemplateMeta {
  PK: string;
  category: string;
  subcategory: string;
  language: string;
  premium: boolean;
  thumbnail_url: string;
  created_at: number;
}

async function getTemplates(): Promise<TemplateMeta[]> {
  try {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "SK = :sk",
        ExpressionAttributeValues: { ":sk": "META" },
        Limit: 100,
      })
    );
    return (result.Items as TemplateMeta[]) || [];
  } catch {
    return [];
  }
}

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600">
              &larr;
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Templates</h1>
          </div>
          <Link
            href="/templates/upload"
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600"
          >
            Upload New
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {templates.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No templates yet</p>
            <p className="text-sm mt-2">
              Upload your first template to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {templates.map((t) => (
              <div
                key={t.PK}
                className="bg-white rounded-lg overflow-hidden border border-gray-200"
              >
                <div className="aspect-square bg-gray-100 relative">
                  {t.thumbnail_url && (
                    <img
                      src={t.thumbnail_url}
                      alt={t.subcategory}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {t.premium && (
                    <span className="absolute top-2 right-2 bg-yellow-400 text-xs font-bold px-2 py-0.5 rounded">
                      PRO
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {t.PK.replace("TEMPLATE#", "")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t.category} &middot; {t.language}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
