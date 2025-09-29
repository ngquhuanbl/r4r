import { Handshake } from "lucide-react";

export function WaitingFallback() {
  return (
    <div className="flex flex-col justify-center items-center gap-2 grow">
      <div className="flex flex-col gap-1 items-center mb-3">
        <Handshake className="animate-bounce" />
        <p className="text-sm sm:text-base">Connecting You to the Network!</p>
      </div>
      <p className="text-xs sm:text-sm">
        Our network community is actively working to introduce your businesses
        to others. <br />
        Their reviews will appear here automatically.
      </p>
      <p className="text-xs sm:text-sm italic">
        Feel free to navigate away — you'll see the results here next time you
        check.
      </p>
    </div>
  );
}
