/**
 * Layout for all table pages
 * Provides consistent padding and container for all table views
 */
export default function TablesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 lg:px-12 py-6">
        {children}
      </div>
    </div>
  );
}
