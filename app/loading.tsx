import Logo from "@/components/shared/logo";

export default function Loading() {
  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center">
      <div className="flex flex-col items-center gap-2 md:gap-4">
        <Logo />
        <div className="w-full bg-gray-300 rounded-sm h-1 md:h-2">
          <div className="w-full bg-primary rounded-sm h-1 md:h-2 origin-left animate-[progress_1s_forwards_ease-out]"></div>
        </div>
      </div>
    </div>
  );
}
