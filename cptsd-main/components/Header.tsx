'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trackNavigation, trackExternalLink } from '@/lib/analytics';

export default function Header() {
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL || 'https://blog.cptsd.in';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700">
            CPTSD.in
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" onClick={() => trackNavigation('/', 'Home')} className="text-gray-700 hover:text-gray-900">
              Home
            </Link>
            <Link href="/start-here" onClick={() => trackNavigation('/start-here', 'Start Here')} className="text-gray-700 hover:text-gray-900">
              Start Here
            </Link>
            <Link href="/learn" onClick={() => trackNavigation('/learn', 'Learn')} className="text-gray-700 hover:text-gray-900">
              Learn
            </Link>
            <Link href="/live" onClick={() => trackNavigation('/live', 'Live')} className="text-gray-700 hover:text-gray-900">
              Live
            </Link>
            <Link href="/resources" onClick={() => trackNavigation('/resources', 'Resources')} className="text-gray-700 hover:text-gray-900">
              Resources
            </Link>
            <Link href="/support" onClick={() => trackNavigation('/support', 'Support')} className="text-gray-700 hover:text-gray-900">
              Support
            </Link>
            <Link href="/community" onClick={() => trackNavigation('/community', 'Community')} className="text-gray-700 hover:text-gray-900">
              Community
            </Link>
            <Link href="/featured" onClick={() => trackNavigation('/featured', 'Featured')} className="text-gray-700 hover:text-gray-900">
              Featured
            </Link>
            <Link href="/about" onClick={() => trackNavigation('/about', 'About')} className="text-gray-700 hover:text-gray-900">
              About
            </Link>
            <a 
              href={blogUrl} 
              onClick={() => trackExternalLink(blogUrl, 'Blog')}
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Blog
            </a>
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900 p-2"
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
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/start-here"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Here
              </Link>
              <Link
                href="/learn"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Learn
              </Link>
              <Link
                href="/live"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Live
              </Link>
              <Link
                href="/resources"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Resources
              </Link>
              <Link
                href="/support"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Support
              </Link>
              <Link
                href="/community"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Community
              </Link>
              <Link
                href="/featured"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Featured
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <a
                href={blogUrl}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

