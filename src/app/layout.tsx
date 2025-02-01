import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "卓ログ置き場",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja-jp">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
