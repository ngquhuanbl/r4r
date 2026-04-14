import Logo from "@/components/shared/logo";

export function Footer() {
  return (
    <footer className="hidden w-full bg-primary dark:bg-slate-950 md:block">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-8 lg:px-16">
        <Logo style="mono" />
        <p className="text-white text-sm">
          &copy; {new Date().getFullYear()} Review4Review. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
