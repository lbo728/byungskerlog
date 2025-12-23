"use client";

import { SignIn } from "@stackframe/stack";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="sign-in-container">
        <SignIn fullPage={false} />
      </div>

      <style jsx>{`
        .sign-in-container :global(a[href*="sign-up"]) {
          display: none !important;
        }
        .sign-in-container :global(*:has(> a[href*="sign-up"])) {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
