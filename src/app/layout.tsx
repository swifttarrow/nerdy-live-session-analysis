import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SessionLens",
  description: "Real-time engagement intelligence for tutoring sessions",
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
