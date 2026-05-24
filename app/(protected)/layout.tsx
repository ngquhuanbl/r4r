import { fetchPlatforms, fetchReviewStatuses } from "./actions/review-actions";

import { Footer } from "@/components/shared/footer";
import { Header } from "@/components/shared/header";
import { StoreProvider } from "./StoreProvider";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/utils/api";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [reviewStatuses, platforms] = await Promise.all([
    unwrap(fetchReviewStatuses()),
    unwrap(fetchPlatforms()),
  ]);

  return (
    <StoreProvider
      initialData={{
        user: user!,
        reviewStatuses,
        platforms,
      }}
    >
      <div className="flex min-h-screen flex-col">
        <Header user={user!} />

        <main className="flex min-h-0 w-full flex-1 flex-col">
          <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 md:px-8 lg:px-16">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </StoreProvider>
  );
}
