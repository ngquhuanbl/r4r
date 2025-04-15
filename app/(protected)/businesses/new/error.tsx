"use client";
import { Button } from "@/components/ui/button";
import * as React from "react";
import Link from 'next/link';

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg text-center">
        <h1 className="text-2xl font-bold">Oops! Something went wrong.</h1>
        <p>
          We encountered an unexpected error. Please try again later or go back
          to the homepage.
        </p>
        <div className="mt-6">
          <Button color="indigo" asChild>
						<Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
