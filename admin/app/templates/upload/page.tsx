"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  "good_morning",
  "good_night",
  "motivational",
  "devotional",
  "festival",
  "shayari",
  "birthday",
  "anniversary",
  "business",
  "patriotic",
  "love",
  "friendship",
];

const LANGUAGES = ["hi", "en", "mr", "gu", "ta", "te", "kn", "ml"];

export default function UploadTemplatePage() {
  const [category, setCategory] = useState("good_morning");
  const [subcategory, setSubcategory] = useState("");
  const [language, setLanguage] = useState("hi");
  const [premium, setPremium] = useState(false);
  const [tags, setTags] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [schemaFile, setSchemaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schemaFile || !thumbnailFile) {
      setMessage("Please select both template JSON and thumbnail image");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("schema", schemaFile);
      formData.append("thumbnail", thumbnailFile);
      formData.append("category", category);
      formData.append("subcategory", subcategory);
      formData.append("language", language);
      formData.append("premium", String(premium));
      formData.append("tags", tags);
      if (scheduledDate) formData.append("scheduled_date", scheduledDate);

      const res = await fetch("/api/templates", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      setMessage("Template uploaded successfully!");
      setSchemaFile(null);
      setThumbnailFile(null);
      setSubcategory("");
      setTags("");
      setScheduledDate("");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/templates" className="text-gray-400 hover:text-gray-600">
            &larr;
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Upload Template</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g., diwali, ganesh"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date (optional)
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="diwali, festival, lights"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="premium"
              checked={premium}
              onChange={(e) => setPremium(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="premium" className="text-sm text-gray-700">
              Premium template
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template JSON
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setSchemaFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.startsWith("Error")
                  ? "text-red-500"
                  : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Template"}
          </button>
        </form>
      </main>
    </div>
  );
}
