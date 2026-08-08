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
});

export const metadata: Metadata = {
  title: "SAT Challenge",
  description: "1v1 Digital SAT Arena",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script 
          src="https://www.desmos.com/api/v1.12/calculator.js?apiKey=0c94a117a824475b8fc9297d73371a3a"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${notoSans.variable} ${notoSerif.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
