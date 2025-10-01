"use client";

import Link from "next/link";

import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Paths } from "@/constants/paths";

export default function NewPasswordPage() {
  return (
    <div className="flex justify-center items-center h-screen w-screen px-5">
      <div className="flex flex-col items-center gap-3">
        <Logo />
        <h1 className="font-semibold text-2xl sm:text-4xl">
          Oops! Something went wrong.
        </h1>
        <p className="text-sm sm:text-base text-center">
          We encountered an unexpected error. Please try again later or go back
          to the homepage.
        </p>
        <div className="mt-6">
          <Button color="indigo" asChild>
            <Link href={Paths.HOME}>Go to Homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
