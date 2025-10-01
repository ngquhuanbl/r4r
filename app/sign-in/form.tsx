"use client";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";

import { signIn } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paths } from "@/constants/paths";
import { SignInSearchParams } from "@/constants/sign-in";
import { ErrorUtils } from "@/utils/error";

export default function SignInForm() {
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isRedirectedAfterPwdUpdated =
    params.get(SignInSearchParams.NEW_PWD) === "1";

  useEffect(() => {
    let toastId: string | number | null = null;
    if (isRedirectedAfterPwdUpdated) {
      toastId = toast.info("Please sign in with your new password", {
        position: "bottom-center",
      });
    }
    return () => {
      if (toastId !== null) {
        toast.dismiss(toastId);
      }
    };
  }, [isRedirectedAfterPwdUpdated]);

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await signIn(formData);
      if (!result.ok) {
        const { error } = result;
        toast.error(`Failed to sign in`, {
          position: "bottom-center",
          duration: 5e3,
          description: ErrorUtils.serializeError(error),
        });
      }
    });
  };

  return (
    <form
      action={onSubmit}
      className="flex flex-col gap-4 items-center sm:items-start w-full"
    >
      <div className="w-full">
        <Label htmlFor="email">Email</Label>
        <Input
          placeholder="Enter your email"
          type="email"
          name="email"
          id="email"
          required
          disabled={isPending}
          autoComplete="email"
        />
      </div>
      <div className="w-full">
        <Label htmlFor="pwd">Password</Label>
        <Input
          type="password"
          placeholder="Enter your password"
          name="password"
          id="pwd"
          required
          disabled={isPending}
        />
      </div>
      <Link
        href={Paths.FORGOT_PWD}
        className="text-sm text-neutral-500 hover:text-primary hover:cursor-pointer"
      >
        Forgot your password?
      </Link>
      <Button className="mt-4 bg-primary w-full sm:w-max" disabled={isPending}>
        {isPending && <Loader2Icon className="animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
