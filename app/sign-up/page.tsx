import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import Logo from "@/components/shared/logo";
import welcomeSrc from "@/public/sign-in/welcome.png";

import SignUpForm from "./form";

export const metadata: Metadata = {
  title: "Sign Up To Review4Review",
  description: `Create your free account today and start tracking, analyzing, and improving your business's customer reviews and online reputation.`,
};

export default function SignUp() {
  return (
    <div className="flex sm:grid sm:grid-cols-[1fr_1fr] gap-20 justify-center items-center h-screen">
      <Image
        className="w-[388px] hidden sm:block justify-self-end"
        src={welcomeSrc}
        width={500}
        height={648}
        alt={""}
        priority
        sizes="(max-width: 640px) 0, 388px"
      />
      <div className="flex flex-col h-full justify-between sm:justify-center py-20 sm:py-0 items-center sm:items-start">
        <Logo />
        <div className="flex flex-col gap-4 items-center sm:items-start mt-0 sm:mt-8 w-full sm:w-max">
          <h1 className="font-semibold text-2xl sm:text-4xl">
            Create your account
          </h1>
          <p className="text-sm sm:text-base">
            Welcome! We're excited to have you.
            <br />
            Please enter your details.
          </p>
          <SignUpForm />
        </div>
        <p className="text-sm mt-4">
          Already had an account?{" "}
          <Link className="font-semibold text-primary" href="/sign-in">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
