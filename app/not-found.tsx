import { Metadata } from "next";
import Link from "next/link";

import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Paths } from "@/constants/paths";

export const metadata: Metadata = {
  title: "Page Not Found (404) - Review4Review",
  description: `Oops! The page you were looking for doesn't exist. Navigate back to the home page to continue managing your business reputation.`,
};

export default function NewPasswordPage() {
  return (
    <div className="flex justify-center items-center h-screen w-screen px-5">
      <div className="flex flex-col items-center gap-3">
        <Logo />
        <h1 className="font-semibold text-2xl sm:text-4xl">Page Not Found</h1>
        <p className="text-sm sm:text-base text-center">
          We can't seem to find the page you're looking for. It might have been
          moved, deleted, or the address was typed incorrectly.
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
