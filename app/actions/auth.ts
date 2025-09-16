"use server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  if (!password) {
    return { error: "Password is required" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, error: error.message || "Unexpected error" };
  }

  return redirect("/home");
}

export async function signUp(formData: FormData) {
  const origin = headers().get("origin");
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { ok: false, error: error.message || "Unexpected error" };
  }

  return {
    ok: true,
    message:
      "Thanks for signing up! Please check your email for a confirmation link to complete your registration.",
  };
}

export const signOut = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/login");
};
