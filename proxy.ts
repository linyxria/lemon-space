import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

import { auth } from "./lib/auth"

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    const url = new URL("/sign-in", request.url)
    url.searchParams.set("callbackURL", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/profile", "/collections/:path*"],
}
