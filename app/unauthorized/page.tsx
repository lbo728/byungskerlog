"use client";

import { useEffect } from "react";
import { useStackApp } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const app = useStackApp();
  const router = useRouter();

  const handleSignOut = async () => {
    await app.signOut();
    router.push("/handler/sign-in");
  };

  useEffect(() => {
    const autoSignOut = async () => {
      await app.signOut();
    };
    autoSignOut();
  }, [app]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="text-6xl">🚫</div>
        <h1 className="text-2xl font-bold text-foreground">
          권한이 없는 계정입니다
        </h1>
        <p className="text-muted-foreground">
          이 계정으로는 접근할 수 없습니다.
          <br />
          허용된 계정으로 다시 로그인해주세요.
        </p>
        <Button onClick={handleSignOut} variant="default">
          로그인 페이지로 돌아가기
        </Button>
      </div>
    </div>
  );
}
