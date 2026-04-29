"use client";

import { Loader2Icon, Mail } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  sendMagicLink,
  signInWithOAuthProvider,
} from "@/app/actions/auth-entry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paths } from "@/constants/paths";
import { ErrorUtils } from "@/utils/error";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const oauthBtnClass =
  "flex w-full items-center justify-center gap-3 rounded-md border border-neutral-300 bg-white py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-neutral-50 dark:border-border dark:bg-card dark:hover:bg-muted";

export function LoginForm() {
  const [view, setView] = useState<"form" | "checkEmail">("form");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [oauthPending, setOauthPending] = useState<string | null>(null);

  const onOAuth = (provider: "google") => {
    setOauthPending(provider);
    startTransition(async () => {
      const res = await signInWithOAuthProvider(provider);
      setOauthPending(null);
      if (!res.ok) {
        toast.error("Could not start sign-in", {
          description: ErrorUtils.serializeError(res.error),
        });
        return;
      }
      window.location.href = res.data.url;
    });
  };

  const onMagicLink = () => {
    startTransition(async () => {
      const res = await sendMagicLink(email);
      if (!res.ok) {
        toast.error("Could not send link", {
          description: ErrorUtils.serializeError(res.error),
        });
        return;
      }
      setView("checkEmail");
    });
  };

  if (view === "checkEmail") {
    return (
      <div className="w-full rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a temporary login link to{" "}
              <span className="font-medium text-foreground">{email}</span>. It
              expires in 15 minutes.
            </p>
          </div>
          <button
            type="button"
            className="text-sm text-primary underline-offset-4 hover:underline"
            onClick={() => void onMagicLink()}
            disabled={pending}
          >
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Sending…
              </span>
            ) : (
              "Didn't get the email? Click to resend."
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Log in to R4R
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The professional network for review exchanges.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className={oauthBtnClass}
          disabled={!!oauthPending || pending}
          onClick={() => onOAuth("google")}
        >
          {oauthPending === "google" ? (
            <Loader2Icon className="h-5 w-5 animate-spin" />
          ) : (
            <GoogleIcon className="h-5 w-5" />
          )}
          Continue with Google
        </button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-200 dark:border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email address</Label>
          <Input
            id="login-email"
            type="email"
            name="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={pending}
          />
        </div>
        <Button
          type="button"
          className="w-full"
          disabled={pending || !email.trim()}
          onClick={() => void onMagicLink()}
        >
          {pending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          Continue with Email
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          We&apos;ll send a magic link to your inbox for a passwordless sign-in.
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="text-primary underline-offset-2 hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-4 text-center text-sm">
        <Link
          href={`${Paths.SIGN_IN}/password`}
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Sign in with password
        </Link>
      </p>
    </div>
  );
}
