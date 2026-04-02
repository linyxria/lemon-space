"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
// 根据你看到的文档，导入 Show 和相关按钮
import {
  UserButton,
  SignInButton,
  SignUpButton,
  Show,
  useUser,
  useClerk,
} from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Image as ImageIcon, Upload, Citrus, User } from "lucide-react";
import { Button } from "./ui/button";

const navItems = [
  { name: "画廊", href: "/", icon: ImageIcon, protected: false },
  { name: "上传", href: "/upload", icon: Upload, protected: true },
  { name: "我的", href: "/profile", icon: User, protected: true },
];

export default function Navbar() {
  const pathname = usePathname();

  // 2. 获取当前登录状态和 Clerk 控制权
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  // 3. 定义拦截函数
  const handleNavClick = (
    e: React.MouseEvent,
    href: string,
    isProtected: boolean,
  ) => {
    if (!isSignedIn && isProtected) {
      e.preventDefault(); // 阻止默认的 <Link> 跳转
      openSignIn({
        // 登录成功后，自动跳转到用户刚才想去的页面
        fallbackRedirectUrl: href,
      });
    }
  };

  return (
    <header className="sticky top-0 z-100 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-black tracking-tighter text-zinc-900 group"
        >
          {/* 图标容器：平时黑底白字，Hover 变青柠底黑字 */}
          <div className="rounded-xl bg-zinc-900 p-1.5 text-white transition-all duration-300 group-hover:bg-lime-400 group-hover:text-zinc-900 group-hover:rotate-12 group-hover:scale-110 shadow-sm group-hover:shadow-lime-200">
            <Citrus size={20} strokeWidth={2.5} />
          </div>

          {/* 文字部分：LEMON 保持深色，GALLERY 始终使用青柠色 */}
          <span className="flex items-baseline gap-1">
            LEMON
            <span className="text-lime-500 font-extrabold tracking-widest italic">
              GALLERY
            </span>
          </span>
        </Link>

        {/* 导航菜单 */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href, item.protected)}
                className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors 
      ${isActive ? "text-lime-700" : "text-zinc-500 hover:text-zinc-900"}`} // 激活时用深青柠色
              >
                <item.icon size={16} />
                {item.name}
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-lime-400/10 border border-lime-400/20" // 极淡背景 + 微弱边框
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* 状态控制：使用你截图中的 Show 模式 */}
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                className="text-sm font-bold text-zinc-500 rounded-full px-5 transition-all
      hover:bg-lime-100 hover:text-lime-700 active:scale-95"
              >
                登录
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="rounded-full bg-lime-400 px-6 font-bold text-lime-950 hover:bg-lime-300 hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] active:scale-95 transition-all">
                注册
              </Button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-4">
              {/* 移动端快捷上传按钮，仅在登录时可见 */}
              <Link href="/" className="md:hidden p-2 text-zinc-500">
                <Upload size={20} />
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "h-9 w-9 border-2 border-white shadow-sm ring-1 ring-zinc-200",
                  },
                }}
                showName
              />
            </div>
          </Show>
        </div>
      </div>
    </header>
  );
}
