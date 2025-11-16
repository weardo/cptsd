import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CrisisBanner from '@/components/CrisisBanner';
import { FloatingPetsContainer } from '@cptsd/pets';
import { Analytics } from '@/components/Analytics';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://cptsd.in'),
  title: {
    default: 'CPTSD.in – Complex trauma awareness in the Indian context',
    template: '%s | CPTSD.in',
  },
  description: 'Awareness and education about Complex PTSD (CPTSD) in the Indian context. Resources, stories, and support for understanding complex trauma.',
  keywords: ['CPTSD', 'Complex PTSD', 'trauma', 'mental health', 'India', 'trauma awareness', 'PTSD', 'trauma recovery'],
  authors: [{ name: 'CPTSD.in' }],
  creator: 'CPTSD.in',
  publisher: 'CPTSD.in',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://cptsd.in',
    siteName: 'CPTSD.in',
    title: 'CPTSD.in – Complex trauma awareness in the Indian context',
    description: 'Awareness and education about Complex PTSD (CPTSD) in the Indian context',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CPTSD.in – Complex trauma awareness',
    description: 'Awareness and education about Complex PTSD (CPTSD) in the Indian context',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? {
        google: process.env.GOOGLE_SITE_VERIFICATION,
      }
    : undefined,
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
        <Analytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_MAIN} />
      </body>
    </html>
  );
}

