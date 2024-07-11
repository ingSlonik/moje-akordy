import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Moje akordy",
  description: "Tohle je zpěvník Fíly!!!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className={openSans.className}>{children}</body>
    </html>
  );
}
