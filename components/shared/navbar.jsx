import Link from "next/link";
import { AuthButton } from "./auth-button";
import { createClient } from "@/lib/supabase/server";

// Get admin ID from environment variables
const adminId = process.env.ADMIN_ID;

export async function Navbar() {
  // Check if user is logged in
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return (
    <nav className="border-b border-gray-200 bg-white text-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              R4R
            </Link>
            
            {user && (
              <div className="ml-10 flex items-center space-x-4">
                <Link href="/home" className="text-sm font-medium hover:text-blue-500">
                  Dashboard
                </Link>
                <Link href="/businesses" className="text-sm font-medium hover:text-blue-500">
                  Businesses
                </Link>
                <Link href="/invitations/new" className="text-sm font-medium hover:text-blue-500">
                  New Invitation
                </Link>
                {user.id === adminId && (
                  <Link 
                    href="/admin" 
                    className="text-sm font-medium text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-1 rounded-full"
                  >
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>

          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
