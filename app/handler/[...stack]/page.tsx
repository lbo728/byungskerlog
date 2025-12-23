import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack/server";

interface HandlerProps {
  params: Promise<Record<string, string | string[]>>;
  searchParams: Promise<Record<string, string | string[]>>;
}

export default function Handler(props: HandlerProps) {
  return (
    <StackHandler
      app={stackServerApp}
      routeProps={props}
      fullPage
    />
  );
}
