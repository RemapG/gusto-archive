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

    // Prevent iOS Safari pinch gesture zoom without blocking scrolling
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("gesturestart", preventGesture);

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
      document.removeEventListener("gesturestart", preventGesture);
    };
  }, [pathname, router]);

  return null;
}
