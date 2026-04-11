export type LocationStatus = "ready" | "full";

export type StatIcon = "up" | "down";

export type DashboardLocation = {
  id: string;
  name: string;
  status: LocationStatus;
  address: string;
  imageSrc: string | null;
  imageAlt: string;
  left: { icon: StatIcon; label: string };
  right: { icon: StatIcon; label: string };
};
