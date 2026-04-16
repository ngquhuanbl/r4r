import { Metadata } from "next";
import Link from "next/link";

import Logo from "@/components/shared/logo";
import { Paths } from "@/constants/paths";

import SignInForm from "../form";

export const metadata: Metadata = {
  title: "Sign in with password | R4R",
  description: "Sign in with your email and password.",
};

export default function SignInWithPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F7] px-4 py-10 dark:bg-background">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-8">
        <Logo />
        <div className="w-full rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="mb-2 text-center text-2xl font-bold tracking-tight">
            Sign in with password
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Use this if you created your account with a password before we
            switched to magic links.
          </p>
          <SignInForm />
        </div>
        <Link
          href={Paths.LOGIN}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to log in
        </Link>
      </div>
    </div>
  );
}
