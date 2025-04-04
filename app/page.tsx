import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Index() {
  // Check if user is logged in
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return (
    <>
      <Navbar />

      <main className="flex flex-col flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="py-20">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Reputation for Reputation
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
                Connect with other businesses, exchange reviews, and build your online reputation across multiple platforms.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {user ? (
                  <Link href="/home">
                    <Button size="lg">Go to Dashboard</Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button size="lg">Get Started</Button>
                  </Link>
                )}
              </div>
            </div>
            
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4">Exchange Reviews</h2>
                <p className="text-gray-600">
                  Send and receive review invitations with other businesses to build your online reputation together.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4">Multi-Platform Support</h2>
                <p className="text-gray-600">
                  Manage your presence across multiple review platforms like Yelp, Google, Facebook and more.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4">Track Relationships</h2>
                <p className="text-gray-600">
                  Easily see the status of all your business relationships and review exchanges in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
