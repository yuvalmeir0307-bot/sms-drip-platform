import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DRIP/OS — RE Wholesale",
  description: "Real estate wholesale SMS drip automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
