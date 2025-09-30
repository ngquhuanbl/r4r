"use client";
import { Loader2Icon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorUtils } from "@/utils/error";

import { updatePwd } from "../actions/auth";

export default function NewPasswordPage() {
  const [isLoading, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    const newPassword = formData.get("new-password");
    const confirmPassword = formData.get("confirm-password");

    if (newPassword !== confirmPassword) {
      toast.error("Invalid input", {
        description: `Confirm password doesn't match new password`,
        position: "bottom-center",
      });
    }

    startTransition(async () => {
      const result = await updatePwd(formData);
      if (!result.ok) {
        toast.error(`Failed to update password`, {
          position: "bottom-center",
          duration: 5e3,
          description: ErrorUtils.serializeError(result.error),
        });
      } else {
        toast.success(`Password updated!`, {
          position: "bottom-center",
          duration: 5e3,
          description: "Redirecting to sign in...",
        });
      }
    });
  };

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
        <form
          action={onSubmit}
          className="flex flex-col items-center gap-4 my-5 w-full md:w-auto"
        >
          <div className="space-y-1 w-[80%] md:w-auto">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              required
              name="new-password"
              className="md:w-[40vh]"
              placeholder="Please enter your new password"
              minLength={8}
              // pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$"
            />
          </div>
          <div className="space-y-1 w-[80%] md:w-auto">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              name="confirm-password"
              className="md:w-[40vh]"
              placeholder="Please re-type your new password"
              minLength={8}
              // pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$"
            />
          </div>
          <Button className="mt-4" type="submit" disabled={isLoading}>
            {isLoading && <Loader2Icon className="animate-spin" />}
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
