import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const html = readFileSync(join(process.cwd(), "public/index.html"), "utf8");
  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

export const config = {
  matcher: "/",
};
