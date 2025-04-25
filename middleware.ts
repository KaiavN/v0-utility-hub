import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if the request is for a non-existent page
  const url = request.nextUrl.clone()

  // If the path starts with /_not-found, redirect to /custom-404
  if (url.pathname.startsWith("/_not-found")) {
    url.pathname = "/custom-404"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Configure the middleware to run only for specific paths
export const config = {
  matcher: ["/_not-found/:path*", "/404/:path*"],
}
