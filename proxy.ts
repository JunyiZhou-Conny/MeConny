import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL("/index.html", request.url));
}

export const config = {
  matcher: "/",
};
