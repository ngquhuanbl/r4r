import { fetchBusinessesCached } from "../actions/business-actions";
import { WorkspaceRealtimeBridge } from "./workspace-realtime-bridge";
import { getUserOrRedirect } from "@/lib/supabase/server";
import { unwrap } from "@/utils/api";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function WorkspaceLayout({ children }: LayoutProps) {
  const user = await getUserOrRedirect();
  const userId = user.id;

  const businesses = await unwrap(fetchBusinessesCached(userId));

  return (
    <WorkspaceRealtimeBridge
      data={{
        userId,
        businessIds: businesses.map((business) => business.id),
      }}
    >
      {children}
    </WorkspaceRealtimeBridge>
  );
}
