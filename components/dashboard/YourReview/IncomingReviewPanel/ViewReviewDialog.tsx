import { ExternalLink } from "lucide-react";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FetchedReview } from "@/types/dashboard";

interface ViewReviewDialogProps {
  open: boolean;
  data: FetchedReview;
  onOpenChange: (open: boolean) => void;
}
export function ViewReviewDialog({
  open,
  data,
  onOpenChange,
}: ViewReviewDialogProps) {
  const { url, content, status, invitation } = data;
  const businessInfo = invitation.business;
  const businessName = businessInfo.business_name;
  const businessAddress = [
    businessInfo.address,
    businessInfo.city,
    businessInfo.state,
  ].join(", ");

  const platformInfo = invitation.platform;
  const platformName = platformInfo.name;

  const reviewURL = url;
  const reviewContent = content;
  const reviewStatusName = status.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen sm:max-w-[60%]">
        <DialogHeader>
          <DialogTitle>Review details</DialogTitle>
          <DialogDescription>
            Details of a review for{" "}
            <span className="font-semibold">{businessName}</span>.
          </DialogDescription>
        </DialogHeader>
        <table className="border border-zinc-300 border-collapse ">
          <tbody>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-sm ">
                Reviewer
              </th>
              <td className="border border-zinc-300 p-2 text-start text-sm ">
                {businessName}
              </td>
            </tr>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-sm">
                Platform
              </th>
              <td className="border border-zinc-300 p-2 text-start text-sm">
                {platformName}
              </td>
            </tr>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-sm ">
                Address
              </th>
              <td className="border border-zinc-300 p-2 text-start text-sm ">
                {businessAddress}
              </td>
            </tr>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-sm ">
                Review URL
              </th>
              <td className="border border-zinc-300 p-2 text-start text-sm ">
                <Link
                  className="underline text-primary"
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
              <th className="border border-zinc-300 text-start p-2 text-sm ">
                Message
              </th>
              <td className="border border-zinc-300 p-2 text-start text-sm ">
                &quot;{reviewContent}&quot;
              </td>
            </tr>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-sm ">
                Status
              </th>
              <td className="border border-zinc-300 p-2 text-start text-sm ">
                {reviewStatusName}
              </td>
            </tr>
          </tbody>
        </table>
      </DialogContent>
    </Dialog>
  );
}
