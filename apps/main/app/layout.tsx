import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CrisisBanner from '@/components/CrisisBanner';
import { FloatingPetsContainer } from '@cptsd/pets';
import { Analytics } from '@/components/Analytics';

// Self-hosted via @fontsource-variable — no network needed at build time
const notoSerif = localFont({
  src: '../node_modules/@fontsource-variable/noto-serif/files/noto-serif-latin-standard-normal.woff2',
  variable: '--font-noto-serif',
  display: 'swap',
  weight: '100 900',
});

const plusJakartaSans = localFont({
  src: [
    {
      path: '../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-italic.woff2',
      style: 'italic',
    },
  ],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
  weight: '200 800',
});

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
  icons: {
    icon: [
      { url: '/logo-final.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#5b8a9f' },
    ],
  },
  manifest: '/site.webmanifest',
  themeColor: '#630ed4',
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
    <html lang="en" className={`${notoSerif.variable} ${plusJakartaSans.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/logo-final.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-surface text-on-surface">
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

