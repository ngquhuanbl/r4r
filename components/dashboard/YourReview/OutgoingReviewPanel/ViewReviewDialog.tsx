import { ExternalLink } from "lucide-react";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OutgoingReview } from "@/types/dashboard";
import { getOutgoingReviewStatus } from "@/utils/outgoing-review";
import { getAddress } from "@/utils/shared";

interface ViewOutgoingReviewDialogProps {
  open: boolean;
  data: OutgoingReview;
  onOpenChange: (open: boolean) => void;
}
export function ViewOutgoingReviewDialog({
  open,
  data,
  onOpenChange,
}: ViewOutgoingReviewDialogProps) {
  const { message, review, business, platform } = data;
  const businessInfo = business;
  const businessName = businessInfo.business_name;
  const businessAddress = getAddress(businessInfo);

  const platformInfo = platform;
  const platformName = platformInfo.name;

  const reviewContent = review.length ? review[0].content! : "";
  const reviewURL = review.length ? review[0].url! : "";
  const reviewStatusName = getOutgoingReviewStatus(data).name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen sm:max-w-[60%]">
        <DialogHeader>
          <DialogTitle>Outgoing review details</DialogTitle>
          <DialogDescription>
            Details of a review from you to{" "}
            <span className="font-semibold">{businessName}</span>.
          </DialogDescription>
        </DialogHeader>
        <table className="border border-zinc-300 border-collapse ">
          <tbody>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-xs sm:text-sm ">
                Receiver
              </th>
              <td className="border border-zinc-300 p-2 text-start text-xs sm:text-sm ">
                {businessName}
              </td>
            </tr>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-xs sm:text-sm">
                Platform
              </th>
              <td className="border border-zinc-300 p-2 text-start text-xs sm:text-sm">
                {platformName}
              </td>
            </tr>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-xs sm:text-sm ">
                Address
              </th>
              <td className="border border-zinc-300 p-2 text-start text-xs sm:text-sm ">
                {businessAddress}
              </td>
            </tr>
            {reviewContent.length ? (
              <>
                <tr>
                  <th className="border border-zinc-300 text-start p-2 text-xs sm:text-sm ">
                    URL
                  </th>
                  <td className="border border-zinc-300 p-2 text-start text-xs sm:text-sm ">
                    <Link
                      className="underline text-primary break-all"
                      href={reviewURL!}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {reviewURL}&nbsp;
                      <ExternalLink className="inline w-3 h-3 align-middle" />
                    </Link>
                  </td>
                </tr>
                <tr>
                  <th className="border border-zinc-300 text-start p-2 text-xs sm:text-sm ">
                    Content
                  </th>
                  <td className="border border-zinc-300 p-2 text-start text-xs sm:text-sm ">
                    &quot;{reviewContent}&quot;
                  </td>
                </tr>
              </>
            ) : null}

            <tr>
              <th className="border border-zinc-300 text-start p-2 text-xs sm:text-sm ">
                Status
              </th>
              <td className="border border-zinc-300 p-2 text-start text-xs sm:text-sm ">
                {reviewStatusName}
              </td>
            </tr>
          </tbody>
        </table>
      </DialogContent>
    </Dialog>
  );
}
