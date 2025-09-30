import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { ForgotPwdForm } from "@/components/forgot-password/ForgotPwdForm";
import Logo from "@/components/shared/logo";
import { Paths } from "@/constants/paths";

export const metadata: Metadata = {
  title: "Recover Account - Reset Your Review4Review Password",
  description: `Can't log in? Enter your email address to receive a secure link to reset your password and quickly regain access to your review management dashboard.`,
};

export default function ResetPasswordPage() {
  return (
    <div className="flex justify-center items-center h-screen w-screen px-5">
      <div className="flex flex-col items-center gap-3">
        <Logo />
        <h1 className="font-semibold text-2xl sm:text-4xl">
          Forgot Your Password?
        </h1>
        <p className="text-sm sm:text-base text-center">
          We'll need to verify your identity first.
          <br />
          Please enter your email below to receive a secure link that will allow
          you to create a new password.
        </p>
        <ForgotPwdForm />
        <Link
          href={Paths.SIGN_IN}
          className="flex items-center gap-2 text-sm text-primary hover:text-sky-900"
        >
          <ArrowLeft /> Back to Sign in
        </Link>
      </div>
    </div>
  );
}
