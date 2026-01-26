"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

const getStandaloneSnapshot = (): boolean => {
  if (typeof window === "undefined") return false;

  const iosStandalone =
    "standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const pwaStandalone = window.matchMedia("(display-mode: standalone)").matches;

  return iosStandalone || pwaStandalone;
};

const getServerSnapshot = (): boolean => false;

/**
 * Detect if running in standalone mode (iOS "Add to Home Screen" or PWA display-mode: standalone)
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/display-mode
 */
export function useStandaloneMode(): boolean {
  return useSyncExternalStore(emptySubscribe, getStandaloneSnapshot, getServerSnapshot);
}
