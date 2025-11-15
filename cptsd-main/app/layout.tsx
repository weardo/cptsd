import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CrisisBanner from '@/components/CrisisBanner';
import { FloatingPetsContainer } from '@cptsd/pets';

export const metadata: Metadata = {
  title: 'CPTSD.in – Complex trauma awareness in the Indian context',
  description: 'Awareness and education about Complex PTSD (CPTSD) in the Indian context',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <FloatingPetsContainer initialCount={4} />
        <CrisisBanner />
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

