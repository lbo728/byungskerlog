"use client";

import { SignIn } from "@stackframe/stack";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignIn fullPage={false} />
    </div>
  );
}
