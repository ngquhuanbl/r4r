import { getUserOrRedirect } from "@/lib/supabase/server";
import { fetchAllBusinesses } from "./actions";
import AdminHeader from "@/components/admin/AdminHeader";
import BusinessList from "@/components/admin/BusinessList";

const adminId = process.env.ADMIN_ID;

export default async function Page() {
  const user = await getUserOrRedirect();
	// TODO: Error page

  // Security check - only allow admin access
  if (user.id !== adminId) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Unauthorized</p>
          <p className="text-sm">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Fetch all businesses for the admin panel
  const businesses = await fetchAllBusinesses();

  return (
    <div className="container mx-auto py-6">
      <AdminHeader />
      
      <div className="grid gap-8">
        <BusinessList businesses={businesses} />
      </div>
    </div>
  );
}
