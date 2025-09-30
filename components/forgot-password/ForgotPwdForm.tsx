"use client";
import { Loader2Icon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { sendResetPwdURL } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorUtils } from "@/utils/error";

export function ForgotPwdForm() {
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
  );
}
