import "./globals.css";
import { Providers } from "@/components/Providers";
import { Inter } from "next/font/google";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SuperLeads",
  description: "Next-generation lead management system",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}