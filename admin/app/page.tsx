import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-orange-500">Poster Admin</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/templates"
            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
          >
            <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Manage, upload, and categorize templates
            </p>
          </Link>

          <Link
            href="/templates/upload"
            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              Upload Template
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Upload new template JSON and assets
            </p>
          </Link>

          <div className="bg-white rounded-xl p-6 border border-gray-200 opacity-50">
            <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
            <p className="text-gray-500 mt-1 text-sm">Coming soon</p>
          </div>
        </div>
      </main>
    </div>
  );
}
