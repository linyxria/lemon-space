"use client";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function PublishButton() {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();

  const handlePublish = () => {
    if (isSignedIn) {
      router.push("/upload"); // 已登录，去上传
    } else {
      openSignIn({ fallbackRedirectUrl: "/upload" });
    }
  };

  return (
    <Button className="mt-8 flex items-center gap-2" onClick={handlePublish}>
      <Sparkles size={16} />
      立即发布
    </Button>
  );
}
