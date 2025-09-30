import { Metadata } from "next";

import { NewPwdForm } from "@/components/new-password/NewPwdForm";
import Logo from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Set New Password - Review4Review Account Security",
  description: `Secure your account. Create a new, strong password now to complete the recovery process and resume managing your business insights.`,
};

export default function NewPasswordPage() {
  return (
    <div className="flex justify-center items-center h-screen w-screen px-5">
      <div className="flex flex-col items-center gap-3">
        <Logo />
        <h1 className="font-semibold text-2xl sm:text-4xl">
          Create Your New Password
        </h1>
        <p className="text-sm sm:text-base text-center">
          Choose a strong, unique password for your account. It must be at least
          8 characters long.
        </p>
        <NewPwdForm />
      </div>
    </div>
  );
}
