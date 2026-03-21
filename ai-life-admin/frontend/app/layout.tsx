import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Life Admin",
  description: "Your personal AI productivity assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}