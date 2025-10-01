"use client";
import { Loader2Icon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { signUp } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorUtils } from "@/utils/error";

export default function SignUpForm() {
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await signUp(formData);
      if (!result.ok) {
        const { error } = result;
        toast.error(`Failed to sign up`, {
          duration: 5e3,
          position: "bottom-center",
          description: ErrorUtils.serializeError(error),
        });
      } else {
        toast.success(result.message, {
          duration: 5e3,
          position: "bottom-center",
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
      <Button className="mt-4 bg-primary w-full sm:w-max" disabled={isPending}>
        {isPending && <Loader2Icon className="animate-spin" />}
        Sign up
      </Button>
    </form>
  );
}
