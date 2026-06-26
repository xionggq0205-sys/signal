import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal — Validate Before You Build",
  description:
    "Collect demand signals, analyze market validity, assess competition, and generate product plans. Don't build in the dark.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-fg">{children}</body>
    </html>
  );
}
