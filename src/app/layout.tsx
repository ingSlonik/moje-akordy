import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

import Head from "next/head";
import Image from "next/image";

import logo from "./icon.png";
import Link from "next/link";

const openSans = Open_Sans({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Fílův zpěvník",
  description: "Osobní zpěvník Fíly! Obsahuje jak písně s akordy tak proložní básničkama. Je úplně bez reklam! A má auto scroll!",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <body className={openSans.className}>
        <nav>
          <div className="content">
            <Link href="/">
              <Image className="logo" alt="Moje akordy Logo" src={logo} width={64} height={64} />
              <span>Fílův zpěvník</span>
            </Link>
          </div>
        </nav>

        {children}

      </body>
    </html>
  );
}
