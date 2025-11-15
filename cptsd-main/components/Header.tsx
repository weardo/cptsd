import Link from 'next/link';

export default function Header() {
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL || 'https://blog.cptsd.in';
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700">
            CPTSD.in
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-gray-900">
              Home
            </Link>
            <Link href="/start-here" className="text-gray-700 hover:text-gray-900">
              Start Here
            </Link>
            <Link href="/learn" className="text-gray-700 hover:text-gray-900">
              Learn
            </Link>
            <Link href="/live" className="text-gray-700 hover:text-gray-900">
              Live
            </Link>
            <Link href="/support" className="text-gray-700 hover:text-gray-900">
              Support
            </Link>
            <Link href="/community" className="text-gray-700 hover:text-gray-900">
              Community
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-gray-900">
              About
            </Link>
            <a 
              href={blogUrl} 
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Blog
            </a>
          </div>
          {/* Mobile menu button - simplified for now */}
          <div className="md:hidden">
            <button className="text-gray-700">☰</button>
          </div>
        </div>
      </nav>
    </header>
  );
}

