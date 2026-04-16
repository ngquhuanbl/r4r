export type LocationStatus = "ready" | "full" | "loading";

/** Left column: incoming reviews needing verify (SUBMITTED). Right: outgoing needing submit (DRAFT), per owned business when `invitee_business_id` is set. */
export type DashboardLocation = {
  id: string;
  name: string;
  status: LocationStatus;
  address: string;
  imageSrc: string | null;
  imageAlt: string;
  left: { count: number };
  right: { count: number };
};
