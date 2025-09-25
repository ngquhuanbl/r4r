import { Footer } from "@/components/shared/footer";
import { Header } from "@/components/shared/header";
import { createClient } from "@/lib/supabase/server";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <div className="flex flex-col min-h-screen">
      <Header userId={user!.id} email={user!.email} />

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
