import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '企业内容协同平台 V1.0 | ECCP',
  description: '面向企业宣传与文化团队的活动协同、选题报送、AI 创作、审核发布一体化平台。',
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
