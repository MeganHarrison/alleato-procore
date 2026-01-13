import Link from "next/link";
import { FileText } from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-8 shadow-md ring-1 ring-slate-200">
        <FileText className="h-10 w-10 text-slate-700" />
        <div className="space-y-2 text-left">
          <h1 className="text-3xl font-semibold text-slate-900">
            Alleato Documentation
          </h1>
          <p className="text-slate-600">
            Browse all project docs, plans, and implementation notes in one place.
          </p>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
          >
            Open Docs
          </Link>
        </div>
      </div>
    </main>
  );
}
