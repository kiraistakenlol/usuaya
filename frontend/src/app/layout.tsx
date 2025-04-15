import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import ThemeRegistry from "@/components/ThemeRegistry";

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Vibe Spanish Helper",
  description: "Your personal Spanish learning assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.className}>
      <body>
        <ThemeRegistry>
          <AppLayout>{children}</AppLayout>
        </ThemeRegistry>
      </body>
    </html>
  );
}
