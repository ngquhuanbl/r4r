import Logo from "@/components/shared/logo";

export function Footer() {
  return (
    <footer className="bg-primary dark:bg-slate-950 hidden md:block">
      <div className="flex items-center justify-between w-full px-5 md:px-16 py-5">
        <Logo style="mono" />
        <p className="text-white text-sm">
          &copy; {new Date().getFullYear()} Review4Review. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
