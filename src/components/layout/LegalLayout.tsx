// src/components/layout/LegalLayout.tsx

interface LegalLayoutProps {
  title: string;
  children: React.ReactNode;
  lastUpdated?: string;
}

export function LegalLayout({ title, children, lastUpdated }: LegalLayoutProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 prose prose-slate">
      <h1>{title}</h1>
      {lastUpdated && (
        <p className="text-sm text-gray-600 not-prose mb-8">
          Last updated: {lastUpdated}
        </p>
      )}
      <div className="prose-headings:scroll-mt-20">
        {children}
      </div>
    </main>
  );
}