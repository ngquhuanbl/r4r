import { Metadata } from "next";

import Logo from "@/components/shared/logo";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in to R4R",
  description:
    "The professional network for review exchanges. Sign in with Google, Microsoft, or email.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F7] px-4 py-10 dark:bg-background">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-8">
        <Logo />
        <LoginForm />
      </div>
    </div>
  );
}
