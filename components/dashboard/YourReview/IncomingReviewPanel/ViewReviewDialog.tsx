import { ExternalLink } from "lucide-react";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/lib/redux/hooks";
import { myBusinessesSelectors } from "@/lib/redux/slices/my-business";
import { IncomingReview } from "@/types/dashboard";
import { getAddress } from "@/utils/shared";

interface ViewReviewDialogProps {
  open: boolean;
  data: IncomingReview;
  onOpenChange: (open: boolean) => void;
}
export function ViewReviewDialog({
  open,
  data,
  onOpenChange,
}: ViewReviewDialogProps) {
  const businessEntries = useAppSelector(myBusinessesSelectors.selectEntries);
  const { url, content, status, invitation } = data;
  const businessInfo = businessEntries[invitation.business.id];
  const businessName = businessInfo.business_name;
  const businessAddress = getAddress(businessInfo);

  const platformInfo = invitation.platform;
  const platformName = platformInfo.name;

  const reviewURL = url;
  const reviewContent = content;
  const reviewStatusName = status.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen sm:max-w-[60%]">
        <DialogHeader>
          <DialogTitle>Incoming review details</DialogTitle>
          <DialogDescription>
            Details of a review from others to your business (
            <span className="font-semibold">{businessName}</span>).
          </DialogDescription>
        </DialogHeader>
        <table className="border border-zinc-300 border-collapse">
          <tbody>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-xs sm:text-sm">
                Reviewer
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
