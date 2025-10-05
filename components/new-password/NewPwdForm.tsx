"use client";
import { Loader2Icon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updatePwd } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paths } from "@/constants/paths";
import { SignInSearchParams } from "@/constants/sign-in";
import { ErrorUtils } from "@/utils/error";

export function NewPwdForm() {
  const [isLoading, startTransition] = useTransition();
  const router = useRouter();
  const params = useSearchParams();

  const onSubmit = (formData: FormData) => {
    const newPassword = formData.get("new-password");
    const confirmPassword = formData.get("confirm-password");

    if (newPassword !== confirmPassword) {
      toast.error("Invalid input", {
        description: `Confirm password doesn't match new password`,
        position: "bottom-center",
      });
      return;
    }

    const code = params.get("code");
    if (!code) {
      toast.error("Unexpected error", {
        description: "Empty session",
      });
      return;
    }

    if (Array.isArray(code)) {
      toast.error("Unexpected error", {
        description: "Invalid session",
      });
      return;
    }

    formData.set("code", code as string);

    startTransition(async () => {
      const result = await updatePwd(formData);
      if (!result.ok) {
        toast.error(`Failed to update password`, {
          position: "bottom-center",
          duration: 5e3,
          description: ErrorUtils.serializeError(result.error),
        });
      } else {
        toast.success(`Password updated successfully!`, {
          position: "bottom-center",
          duration: 5e3,
          description: "Signing you in ...",
        });
        setTimeout(() => {
          const params = new URLSearchParams();
          params.append(SignInSearchParams.NEW_PWD, "1");
          router.replace(`${Paths.SIGN_IN}?${params.toString()}`);
        }, 1e3);
      }
    });
  };
  return (
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
  );
}
