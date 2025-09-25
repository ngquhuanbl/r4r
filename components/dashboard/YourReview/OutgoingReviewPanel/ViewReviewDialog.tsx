import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OutgoingReview } from "@/types/dashboard";
import { getOutgoingReviewStatus } from "@/utils/outgoing-review";

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
  const businessAddress = [
    businessInfo.address,
    businessInfo.city,
    businessInfo.state,
  ].join(", ");

  const platformInfo = platform;
  const platformName = platformInfo.name;

  const reviewContent = review.length ? review[0].content! : "";
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
              <th className="border border-zinc-300 text-start p-2 text-sm ">
                Receiver
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
                Message
              </th>
              <td className="border border-zinc-300 p-2 text-start text-sm ">
                {reviewContent.length ? <>&quot;{reviewContent}&quot;</> : null}
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
