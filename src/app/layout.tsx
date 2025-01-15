import type { Metadata } from "next";
import "./globals.css";
import Header from "./header";

export const metadata: Metadata = {
  title: "卓ログ置き場",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja-jp">
      <body>
        <Header />
        <main className="container mx-auto p-2 pt-14 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
