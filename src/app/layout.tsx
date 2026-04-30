import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "누가 더 좋아할까? - 카톡 분석기",
  description: "카카오톡 대화를 분석해서 관계를 파헤쳐보세요",
  openGraph: {
    title: "누가 더 좋아할까? - 카톡 분석기",
    description: "카카오톡 대화를 분석해서 관계를 파헤쳐보세요",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
