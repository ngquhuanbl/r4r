import Link from "next/link";

function NavLink({ href, children }) {
  return (
    <Link href={href} className="transition hover:text-teal-500">
      {children}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="mt-32 flex-none border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 justify-between items-center">
          <p className="text-sm text-zinc-400">
            &copy; {new Date().getFullYear()} R4R.
          </p>
        </div>
      </div>
    </footer>
  );
}
