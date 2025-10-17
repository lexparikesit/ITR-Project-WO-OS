import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// 👉 Wajib: CSS Mantine
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "mantine-datatable/styles.css";

import { ColorSchemeScript } from "@mantine/core";
import Providers from "./providers"; // provider global Mantine + React Query

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web Ops",
  description: "Internal web app",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-mantine-color-scheme="dark">
      
      <head>
        {/* biar color scheme Mantine sinkron */}
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
