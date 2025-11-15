import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CPTSD Blog',
  description: 'Resources and insights on Complex PTSD recovery and healing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

