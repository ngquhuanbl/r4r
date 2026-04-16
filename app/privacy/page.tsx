import { Metadata } from "next";
import Link from "next/link";

import { Paths } from "@/constants/paths";

export const metadata: Metadata = {
  title: "Privacy Policy | R4R",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">
        Placeholder page. Replace with your privacy policy.
      </p>
      <p className="mt-8">
        <Link href={Paths.LOGIN} className="text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
