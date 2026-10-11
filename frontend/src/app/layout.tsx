import type { Metadata } from "next";
import { Noto_Sans, Noto_Serif } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "SAT Arena",
  description: "Bluebook-style Digital SAT practice and 1v1 matches on official College Board questions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${notoSans.variable} ${notoSerif.variable} font-sans antialiased`}
      >
        {children}
        <Script
          src="https://www.desmos.com/api/v1.12/calculator.js?apiKey=0c94a117a824475b8fc9297d73371a3a"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
