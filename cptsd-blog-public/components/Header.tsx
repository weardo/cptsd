import Link from 'next/link';

export default function Header() {
  const mainUrl = process.env.NEXT_PUBLIC_MAIN_URL || 'https://cptsd.in';
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700">
            CPTSD Healing Blog
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-gray-900">
              Home
            </Link>
            <form
              method="get"
              action="/"
              className="flex items-center gap-2"
            >
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  placeholder="Search articles..."
                  className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soft-lavender focus:border-transparent bg-white text-gray-900 text-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                type="submit"
                className="btn btn-primary text-sm"
              >
                Search
              </button>
            </form>
            <a 
              href={mainUrl} 
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Main Site
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

