"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { BookOpen, Newspaper, Heart, User } from "lucide-react";
import { getUnreadMessagesCountAction } from "@/app/actions/chat";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkModal = () => {
      const open =
        document.body.classList.contains("modal-open") ||
        document.body.getAttribute("data-modal-open") === "true";
      setIsModalOpen(open);
    };

    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-modal-open"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const checkUnread = async () => {
      const res = await getUnreadMessagesCountAction();
      if (res.success && typeof res.count === "number") {
        setUnreadCount(res.count);
      }
    };

    checkUnread();
    const interval = setInterval(checkUnread, 4000);
    return () => clearInterval(interval);
  }, [session]);

  const navItems = [
    {
      name: "Каталог",
      href: "/",
      icon: BookOpen,
      isActive: (path: string) =>
        path === "/" || path.startsWith("/recipe") || path.startsWith("/course"),
    },
    {
      name: "Блог",
      href: "/blog",
      icon: Newspaper,
      isActive: (path: string) => path.startsWith("/blog"),
    },
    {
      name: "Обо мне",
      href: "/about",
      icon: Heart,
      isActive: (path: string) => path.startsWith("/about"),
    },
    {
      name: "Кабинет",
      href: "/cabinet",
      icon: User,
      isActive: (path: string) =>
        path.startsWith("/cabinet") || path.startsWith("/auth"),
      badge: unreadCount,
    },
  ];

  if (isModalOpen) return null;

  return (
    <nav
      aria-label="Мобильная навигация"
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 md:hidden w-[92%] max-w-[400px] touch-none select-none"
    >
      <div className="w-full flex items-center justify-around px-2 py-2 bg-black/40 text-white backdrop-blur-2xl backdrop-saturate-150 border border-white/20 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.25)]">
        {navItems.map((item) => {
          const isActive = item.isActive(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center justify-center rounded-full transition-all duration-300 select-none ${
                isActive
                  ? "bg-white/20 text-white px-4 py-2.5 font-medium shadow-sm border border-white/20 backdrop-blur-md"
                  : "text-white/70 hover:text-white active:scale-95 px-3.5 py-2.5"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  size={22}
                  className={
                    isActive
                      ? "text-white stroke-[2.2]"
                      : "text-white/75 stroke-[1.8]"
                  }
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-black/40 animate-pulse" />
                )}
              </div>

              {isActive && (
                <motion.span
                  initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                  animate={{ opacity: 1, width: "auto", marginLeft: 7 }}
                  exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="text-[12.5px] font-semibold tracking-wide whitespace-nowrap overflow-hidden"
                >
                  {item.name}
                </motion.span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
