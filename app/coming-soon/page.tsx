import Image from "next/image";
import dreamSrc from "@/public/coming-soon/dream.png";

export default function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-7">
      <Image
        src={dreamSrc}
        alt={""}
        width={441}
        height={483}
        sizes="(max-width: 768px) 90vw, 441px"
      />
      <h1 className="text-5xl md:text-6xl font-bold  tracking-[-.08em] mt-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 animate-pulse">
        We're Almost There!
      </h1>
      <p className="mt-4 text-lg font-light text-black dark:text-white leading-6">
        Our new website is currently under development. Get ready for an amazing
        experience!
      </p>
    </div>
  );
}
