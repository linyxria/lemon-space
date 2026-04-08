import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 定义哪些路径是“受保护”的
const isProtectedRoute = createRouteMatcher(['/upload(.*)', '/profile(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // 在新版本中，auth() 返回 Promise，需要 await
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // 忽略 Next.js 内部文件和所有静态资源
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // 总是运行 API 路由
    '/(api|trpc)(.*)',
  ],
}
