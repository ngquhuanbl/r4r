import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Submit } from "./submit";

export default function Login({ searchParams }) {
  const signIn = async (formData) => {
    "use server";

    const email = formData.get("email");
    const password = formData.get("password");
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return redirect("/login?message=Could not authenticate user");
    }

    return redirect("/home");
  };

  const signUp = async (formData) => {
    "use server";

    const origin = headers().get("origin");
    const email = formData.get("email");
    const password = formData.get("password");
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return redirect("/login?message=Could not authenticate user");
    }

    return redirect("/login?message=Check email to continue sign in process");
  };

  return (
    <div className="flex-1 flex items-center justify-center px-8">
      <div className="w-full max-w-md">
        <form className="flex-1 flex flex-col w-full justify-center gap-2">
          <Link className="my-2" href="/">
            &larr; Back
          </Link>

          <label className="text-md" htmlFor="email">
            Email
          </label>
          <input
            className="px-4 py-2 border border-gray-300 mb-6 text-black"
            name="email"
            placeholder="you@example.com"
            required
          />
          
          <label className="text-md" htmlFor="password">
            Password
          </label>
          <input
            className="px-4 py-2 border border-gray-300 mb-6 text-black"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
          
          <Submit
            formAction={signIn}
            className="bg-gray-200 px-4 py-2 text-black mb-2"
            pendingText="Signing In..."
          >
            Sign In
          </Submit>
          
          <Submit
            formAction={signUp}
            className="border border-gray-300 px-4 py-2 mb-2"
            pendingText="Signing Up..."
          >
            Sign Up
          </Submit>
          
          {searchParams?.message && (
            <p className="mt-4 p-4 bg-gray-100 dark:bg-gray-800  text-center">
              {searchParams.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}