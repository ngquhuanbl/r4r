import Link from "next/link";
import type { Metadata } from "next";

import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Paths } from "@/constants/paths";

export const metadata: Metadata = {
  title: "Authentication Error | R4R",
  description: "Session verification failed. Please retry login.",
};

/**
 * Authentication failure page used when middleware cannot validate a session
 * for protected routes (fail-closed behavior).
 */
export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <Logo />
        <h1 className="text-2xl font-semibold sm:text-3xl whitespace-nowrap">
          We could not verify your session
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Please sign in again. <br/>If this keeps happening, wait a moment and
          retry.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="ocean">
            <Link href={Paths.LOGIN}>Go to Login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={Paths.AUTH_CALLBACK}>Retry</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
