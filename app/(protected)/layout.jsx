import { Navbar } from "@/components/shared/navbar";

export default async function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Page content */}
      <main className="flex-1 bg-white">
        <div className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}