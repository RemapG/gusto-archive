import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";
import MobileBottomNav from "@/components/MobileBottomNav";
import TelegramInit from "@/components/TelegramInit";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "В гостях у Лидии",
  description: "Исключительные кулинарные впечатления",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col pb-24 md:pb-0">
        <Providers>
          <TelegramInit />
          {children}
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
