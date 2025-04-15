import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Amplify Test App",
  description: "Minimal Next.js app for Amplify testing",
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