import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProviderWrapper } from "./components/ThemeProviderWrapper";
import { TopMenuBar } from "./components/TopMenuBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  description: "Configurable RAG chat Interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground h-full`}
      >
        <ThemeProviderWrapper>
          <div className="h-full flex flex-col">
            <TopMenuBar />
            {children}
          </div>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
