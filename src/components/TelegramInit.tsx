"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export default function TelegramInit() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Prevent iOS / Safari / WebKit pinch-to-zoom and multi-touch gestures
    const preventPinchZoom = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener("touchstart", preventPinchZoom, { passive: false });
    document.addEventListener("touchmove", preventPinchZoom, { passive: false });
    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);
    document.addEventListener("gestureend", preventGesture);
    document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });

    // 2. Telegram WebApp initialization
    const tg = window.Telegram?.WebApp;
    if (tg) {
      try {
        // Signal Telegram that Web App is ready
        tg.ready();

        // Expand to full available screen height
        tg.expand();

        // Prevent accidental swipe down to close inside Telegram
        if (tg.disableVerticalSwipes) {
          tg.disableVerticalSwipes();
        }

        // Style header and background to match our aesthetic
        if (tg.setHeaderColor) {
          tg.setHeaderColor("#fcfcf9");
        }
        if (tg.setBackgroundColor) {
          tg.setBackgroundColor("#fcfcf9");
        }

        // Sync Telegram native BackButton with Next.js navigation
        if (tg.BackButton) {
          if (pathname !== "/") {
            tg.BackButton.show();
            const handleBack = () => {
              router.back();
            };
            tg.BackButton.onClick(handleBack);
            return () => {
              tg.BackButton.offClick(handleBack);
            };
          } else {
            tg.BackButton.hide();
          }
        }
      } catch (e) {
        console.warn("Telegram WebApp init error:", e);
      }
    }

    return () => {
      document.removeEventListener("touchstart", preventPinchZoom);
      document.removeEventListener("touchmove", preventPinchZoom);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchend", preventDoubleTapZoom);
    };
  }, [pathname, router]);

  return null;
}
