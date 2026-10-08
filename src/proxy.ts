import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  areaForPath,
  canAccess,
  isStaffRole,
  landingForRole,
} from "@/lib/access";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) return NextResponse.next();

  if (!token || token.error === "RefreshAccessTokenError") {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/?callbackUrl=${callbackUrl}`, request.url),
    );
  }

  if (!isStaffRole(token.role)) {
    return NextResponse.redirect(new URL("/?error=AccessDenied", request.url));
  }

  if (!canAccess(token.role, areaForPath(pathname))) {
    return NextResponse.redirect(
      new URL(landingForRole(token.role), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|assets|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
