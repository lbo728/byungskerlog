"use client";

import { useEffect, useState } from "react";
import { useStackApp } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const app = useStackApp();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(true);

  useEffect(() => {
    const deleteAndSignOut = async () => {
      try {
        await fetch("/api/auth/delete-unauthorized", { method: "POST" });
      } catch (error) {
        console.error("Failed to delete user:", error);
      }

      await app.signOut();
      setIsDeleting(false);
    };

    deleteAndSignOut();
  }, [app]);

  const handleGoToSignIn = () => {
    router.push("/handler/sign-in");
  };

  if (isDeleting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="text-6xl">🚫</div>
        <h1 className="text-2xl font-bold text-foreground">권한이 없는 계정입니다</h1>
        <p className="text-muted-foreground">
          이 계정으로는 접근할 수 없습니다.
          <br />
          허용된 계정으로 다시 로그인해주세요.
        </p>
        <Button onClick={handleGoToSignIn} variant="default">
          로그인 페이지로 돌아가기
        </Button>
      </div>
    </div>
  );
}
