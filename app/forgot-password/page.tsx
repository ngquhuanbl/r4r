"use client";
import { ArrowLeft, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paths } from "@/constants/paths";
import { ErrorUtils } from "@/utils/error";

import { sendResetPwdURL } from "../actions/auth";

export default function ResetPasswordPage() {
  const [isLoading, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await sendResetPwdURL(formData);
      if (!result.ok) {
        toast.error(`Failed to send reset password URL`, {
          position: "bottom-center",
          duration: 5e3,
          description: ErrorUtils.serializeError(result.error),
        });
      } else {
        toast.success(`Success! Check Your Inbox.`, {
          position: "bottom-center",
          duration: 10e3,
          description: (
            <span>
              We've sent a password reset link to{" "}
              <b>{formData.get("email") as string}</b>.<br />
              Please check your spam folder if you don't see it within a few
              minutes.
              <br />
              <b>The link will expire in 24 hours</b>.
            </span>
          ),
        });
      }
    });
  };
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
        <form
          action={onSubmit}
          className="flex flex-col md:flex-row items-center gap-4 my-5 w-full md:w-auto"
        >
          <Label hidden htmlFor="email">
            Email:
          </Label>
          <Input
            id="email"
            type="email"
            required
            name="email"
            className="md:w-[30vh]"
            placeholder="Please enter your email"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2Icon className="animate-spin" />}
            Email Me a Reset Link
          </Button>
        </form>
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
