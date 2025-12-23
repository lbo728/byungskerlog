import { StackClientApp } from "@stackframe/stack";

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

export const stackClientApp =
  projectId && publishableClientKey
    ? new StackClientApp({
        tokenStore: "nextjs-cookie",
        projectId,
        publishableClientKey,
      })
    : null;
