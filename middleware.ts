import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const isMaintenanceMode = true;

export async function middleware(request: NextRequest) {
  const comingSoonPage = "/coming-soon";
  const url = request.nextUrl.clone();

  // Exclude API routes, static files, and the coming soon page itself
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/favicon.ico") ||
    url.pathname === comingSoonPage
  ) {
    return NextResponse.next();
  }

  if (isMaintenanceMode) {
    // Redirect all requests to the coming soon page
    if (url.pathname !== comingSoonPage) {
      url.pathname = comingSoonPage;
      return NextResponse.redirect(url);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
