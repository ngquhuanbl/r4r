import { Footer } from "@/components/shared/footer";
import { Header } from "@/components/shared/header";

export default async function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Page content */}
      <main className="flex-1">
        <div className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
