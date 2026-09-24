import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CHAINTRACE — Multi-chain wallet intelligence",
  description:
    "Explore public wallet activity, network fees and current crypto markets in one clear dashboard.",
  icons: { icon: "/favicon.svg" },
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
