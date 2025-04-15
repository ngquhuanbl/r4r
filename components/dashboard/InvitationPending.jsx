"use client";

import { useTransition } from "react";
import Container from "@/components/dashboard/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  acceptInvitation,
  rejectInvitation,
} from "@/app/(protected)/home/actions";
import { toast } from "sonner";

export default function InvitationPending({ invitation, platformStyles = {} }) {
  const [isAccepting, startAccepting] = useTransition();
  const [isRejecting, startRejecting] = useTransition();

  const handleAccept = () => {
    startAccepting(async () => {
      try {
        const result = await acceptInvitation(invitation.id);
        if (result.success) {
          toast.success(`Accept invitation successfully`);
        } else {
          throw result.error;
        }
      } catch (e) {
        toast.error("Failed to accept invitation", {
          description: `Error: ${e}`,
        });
      }
    });
  };

  const handleReject = () => {
    startRejecting(async () => {
      try {
        const result = await rejectInvitation(invitation.id);
        if (result.success) {
          toast.success(`Reject invitation successfully`);
        } else {
          throw result.error;
        }
      } catch (e) {
        toast.error("Failed to reject invitation", {
          description: `Error: ${e}`,
        });
      }
    });
  };

  const platformData = platformStyles[invitation.platform?.id] || {
    color: "bg-gray-500",
    name: "Unknown",
  };

  const disabled = isAccepting || isRejecting;

  return (
    <Container key={invitation.id}>
      <div>
        <h1 className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
          {invitation.business?.business_name || "Unknown Business"}

          <Badge className={`ml-2 ${platformData.color}`}>
            {platformData.name}
          </Badge>
        </h1>
        <p className="text-sm text-gray-500">
          {invitation.business?.address}, {invitation.business?.city},{" "}
          {invitation.business?.state} {invitation.business?.zip_code}
        </p>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={handleReject}
          disabled={disabled}
          loading={isRejecting}
        >
          Decline
        </Button>
        <Button
          onClick={handleAccept}
          disabled={disabled}
          loading={isAccepting}
        >
          Accept & Review
        </Button>
      </div>
    </Container>
  );
}
