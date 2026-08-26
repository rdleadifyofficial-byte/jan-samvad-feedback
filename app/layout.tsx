import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "जन संवाद फीडबैक हब", description: "QR आधारित सार्वजनिक फीडबैक और जन-जागरूकता मंच", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="hi"><body className="antialiased">{children}</body></html>; }
