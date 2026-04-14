import Logo from "@/components/shared/logo";
import { PROTECTED_CONTENT_SHELL_CLASS } from "@/constants/layout";

export function Footer() {
  return (
    <footer className="hidden w-full bg-primary dark:bg-slate-950 md:block">
      <div
        className={`${PROTECTED_CONTENT_SHELL_CLASS} flex w-full items-center justify-between py-5`}
      >
        <Logo style="mono" />
        <p className="text-white text-sm">
          &copy; {new Date().getFullYear()} Review4Review. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
