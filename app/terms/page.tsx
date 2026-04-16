import { Metadata } from "next";
import Link from "next/link";

import { Paths } from "@/constants/paths";

export const metadata: Metadata = {
  title: "Terms of Service | R4R",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-muted-foreground">
        Placeholder page. Replace with your legal terms or point{" "}
        <code className="rounded bg-muted px-1 text-sm">NEXT_PUBLIC_APP_URL</code>{" "}
        to an external policy URL if preferred.
      </p>
      <p className="mt-8">
        <Link href={Paths.LOGIN} className="text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
