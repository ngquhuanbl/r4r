import { Tables } from "@/types/database";

export function getAddress(
  business: Pick<Tables<"businesses">, "address" | "city" | "state">
) {
  return [business.address, business.city, business.state].join(", ");
}

export function getUsernameFromEmail(email: string) {
  const regex = /^[^@]+/;
  const match = email.match(regex);
  return match ? match[0] : "";
}

export function getTotalPage(totalResults: number, pageSize: number) {
	return Math.ceil(totalResults / pageSize);
}