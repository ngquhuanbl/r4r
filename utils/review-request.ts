import { InvitationStatusNames } from "@/constants/shared";
import { Tables } from "@/types/database";

export namespace ReviewRequestUtils {
  export function isAcceptedStatus(
    status: Tables<"invitation_statuses">["name"]
  ) {
    return status === InvitationStatusNames.ACCEPTED;
  }
  export function isRejectedStatus(
    status: Tables<"invitation_statuses">["name"]
  ) {
    return status === InvitationStatusNames.REJECTED;
  }
  export function isPendingStatus(
    status: Tables<"invitation_statuses">["name"]
  ) {
    return status === InvitationStatusNames.PENDING;
  }
}
