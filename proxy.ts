import { type NextRequest, NextResponse } from 'next/server'

import { getSession } from './lib/auth'

export async function proxy(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    const url = new URL('/sign-in', request.url)
    url.searchParams.set('callbackURL', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/upload', '/profile'],
}
