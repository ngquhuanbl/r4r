import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export async function AuthButton() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const signOut = async () => {
    "use server";

    const supabase = createClient();
    await supabase.auth.signOut();
    return redirect("/login");
  };
  
  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm">{user.email}</span>
  
      <form action={signOut}>
        <button className="text-sm underline text-fuchsia-600 hover:text-fuchsia-800">
          Logout
        </button>
      </form>
    </div>
  ) : (
    <Link href="/login">login</Link>
  );
}
