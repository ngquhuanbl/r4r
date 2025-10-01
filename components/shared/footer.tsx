import Logo from "@/components/shared/logo";

export function Footer() {
  return (
    <footer className="bg-primary dark:bg-sky-950 py-1 hidden md:block px-8">
      <div className="max-w-7xl mx-auto flex items-center w-full justify-between px-5 md:px-8">
        <Logo style="mono" />
        <p className="text-white text-sm">
          &copy; 2025 Review4Review. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
