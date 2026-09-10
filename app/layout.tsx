import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  icons: { icon: '/favicon.svg' },
  title: 'Guildwake — 여명의 길드',
  description:
    '작은 길드에서 시작하는 원정과 동료들의 이야기. 대원을 선택하고, 미지의 섬을 탐험하고, 길드를 재건하세요.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body>{children}</body>
    </html>
  );
}
