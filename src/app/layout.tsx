import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atcoder Multi Charts",
  description: "複数のAtCoderユーザーのレート推移を比較することができます",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
