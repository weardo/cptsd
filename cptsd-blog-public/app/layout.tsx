import type { Metadata } from 'next';
import { Merriweather, Inter } from 'next/font/google';
import './globals.css';
import { FloatingPetsContainer } from '@cptsd/pets';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CrisisBanner from '@/components/CrisisBanner';
import { Analytics } from '@/components/Analytics';

const merriweather = Merriweather({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-merriweather',
});

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://cptsd-blog.com'),
  title: {
    default: 'CPTSD Healing Blog | Resources for Complex PTSD Recovery',
    template: '%s | CPTSD Healing Blog',
  },
  description: 'A safe, supportive space for sharing resources, insights, and stories about Complex PTSD recovery and healing. Find guidance, support, and hope on your healing journey.',
  keywords: [
    'CPTSD',
    'Complex PTSD',
    'PTSD recovery',
    'trauma healing',
    'mental health',
    'trauma therapy',
    'C-PTSD',
    'complex trauma',
    'trauma recovery',
    'healing journey',
    'trauma support',
  ],
  authors: [{ name: 'CPTSD Healing Blog' }],
  creator: 'CPTSD Healing Blog',
  publisher: 'CPTSD Healing Blog',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'CPTSD Healing Blog',
    title: 'CPTSD Healing Blog | Resources for Complex PTSD Recovery',
    description: 'A safe, supportive space for sharing resources, insights, and stories about Complex PTSD recovery and healing.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CPTSD Healing Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CPTSD Healing Blog | Resources for Complex PTSD Recovery',
    description: 'A safe, supportive space for sharing resources, insights, and stories about Complex PTSD recovery and healing.',
    images: ['/og-image.jpg'],
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
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${merriweather.variable} ${inter.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#5b8a9f" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased bg-[#fafafa]">
        <FloatingPetsContainer initialCount={3} />
        <CrisisBanner />
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <Analytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_BLOG} />
      </body>
    </html>
  );
}


