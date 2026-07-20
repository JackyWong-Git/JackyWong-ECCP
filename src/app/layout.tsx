import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ContentFlow - 内容创作全链路平台',
  description: '从选题、写作、编辑到发布的一站式内容创作工作空间',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
