import { fetchBusinesses } from "../actions/business-actions";
import { WorkspaceHydrator } from "./workspace-hydrator";
import { getUserOrRedirect } from "@/lib/supabase/server";
import { unwrap } from "@/utils/api";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function WorkspaceLayout({ children }: LayoutProps) {
  const user = await getUserOrRedirect();
  const userId = user.id;

  const myBusinesses = await unwrap(fetchBusinesses(userId));

  return (
    <WorkspaceHydrator
      data={{
        userId,
        myBusinesses,
      }}
    >
      {children}
    </WorkspaceHydrator>
  );
}
