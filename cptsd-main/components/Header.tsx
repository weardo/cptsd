'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { trackNavigation } from '@/lib/analytics';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="glass sticky top-0 z-[70]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-on-surface hover:text-primary no-underline">
            <Image
              src="/logo-final.svg"
              alt="CPTSD.in"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            <span className="font-serif">CPTSD.in</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" onClick={() => trackNavigation('/', 'Home')} className="text-on-surface-variant hover:text-primary no-underline">
              Home
            </Link>
            <Link href="/start-here" onClick={() => trackNavigation('/start-here', 'Start Here')} className="text-on-surface-variant hover:text-primary no-underline">
              Start Here
            </Link>
            <Link href="/learn" onClick={() => trackNavigation('/learn', 'Learn')} className="text-on-surface-variant hover:text-primary no-underline">
              Learn
            </Link>
            <Link href="/live" onClick={() => trackNavigation('/live', 'Live')} className="text-on-surface-variant hover:text-primary no-underline">
              Live
            </Link>
            <Link href="/resources" onClick={() => trackNavigation('/resources', 'Resources')} className="text-on-surface-variant hover:text-primary no-underline">
              Resources
            </Link>
            <Link href="/mental-health-professionals" onClick={() => trackNavigation('/mental-health-professionals', 'Mental Health Professionals')} className="text-on-surface-variant hover:text-primary no-underline">
              Find Help
            </Link>
            <Link href="/support" onClick={() => trackNavigation('/support', 'Support')} className="text-on-surface-variant hover:text-primary no-underline">
              Support
            </Link>
            <Link href="/community" onClick={() => trackNavigation('/community', 'Community')} className="text-on-surface-variant hover:text-primary no-underline">
              Community
            </Link>
            <Link href="/featured" onClick={() => trackNavigation('/featured', 'Featured')} className="text-on-surface-variant hover:text-primary no-underline">
              Featured
            </Link>
            <Link href="/about" onClick={() => trackNavigation('/about', 'About')} className="text-on-surface-variant hover:text-primary no-underline">
              About
            </Link>
            <Link
              href="/blog"
              onClick={() => trackNavigation('/blog', 'Blog')}
              className="text-on-surface-variant hover:text-primary no-underline font-medium"
            >
              Blog
            </Link>
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-on-surface-variant hover:text-primary focus:outline-none p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* Mobile menu — background shift instead of border (No-Line Rule) */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface-container-low rounded-b-xl">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="block px-3 py-2 text-base font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/start-here"
                className="block px-3 py-2 text-base font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Here
              </Link>
              <Link
                href="/learn"
                className="block px-3 py-2 text-base font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Learn
              </Link>
              <Link
                href="/live"
                className="block px-3 py-2 text-base font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Live
              </Link>
              <Link
                href="/resources"
                className="block px-3 py-2 text-base font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Resources
              </Link>
              <Link
                href="/mental-health-professionals"
                className="block px-3 py-2 text-base font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Find Help
              </Link>
              <Link
                href="/support"
                className="block px-3 py-2 text-base font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Support
              </Link>
              <Link
                href="/community"
                className="block px-3 py-2 text-base font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Community
              </Link>
              <Link
                href="/featured"
                className="block px-3 py-2 text-base font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Featured
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-base font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/blog"
                className="block px-3 py-2 text-base font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

