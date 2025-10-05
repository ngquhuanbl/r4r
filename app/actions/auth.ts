"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/paths";
import { createClient } from "@/lib/supabase/server";
import { APIResponse } from "@/types/shared";

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
    console.error(`Failed to sign in`, error);
    return { ok: false, error: error.message || "Unexpected error" };
  }

  return redirect(Paths.HOME);
}

export async function signUp(formData: FormData) {
  const origin = headers().get("origin");
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(`Failed to sign up`, error);
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
  return redirect(Paths.SIGN_IN);
};

export const sendResetPwdURL = async (
  formData: FormData
): Promise<APIResponse<void>> => {
  const email = formData.get("email") as string;
  const origin = headers().get("origin");

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}${Paths.NEW_PWD}`,
  });

  if (error) {
    console.error(`Failed to send reset pwd url:`, error);
    return { ok: false, error };
  }

  return {
    ok: true,
    data: undefined,
  };
};

export const updatePwd = async (
  formData: FormData
): Promise<APIResponse<void>> => {
  const password = formData.get("new-password") as string;

  const supabase = createClient();
  const code = formData.get("code") as string;
  await supabase.auth.exchangeCodeForSession(code);

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error(`Failed to update password:`, error);
    return { ok: false, error };
  }

  return {
    ok: true,
    data: undefined,
  };
};
