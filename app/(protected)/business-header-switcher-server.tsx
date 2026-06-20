import { fetchBusinessesCached } from "@/app/(protected)/actions/business-actions";
import { BusinessHeaderSwitcherClient } from "@/components/shared/header/business-header-switcher-client";
import type { UserId } from "@/types/shared";
import { unwrap } from "@/utils/api";

type BusinessHeaderSwitcherServerProps = {
  userId: UserId;
};

export async function BusinessHeaderSwitcherServer({
  userId,
}: BusinessHeaderSwitcherServerProps) {
  const businesses = await unwrap(fetchBusinessesCached(userId));
  return <BusinessHeaderSwitcherClient businesses={businesses} />;
}
