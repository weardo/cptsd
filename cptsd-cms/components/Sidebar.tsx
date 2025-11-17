'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { useSidebar } from './SidebarProvider';

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const menuItems = [
    {
      title: 'Main',
      items: [
        { href: '/', label: 'Posts', icon: '📝' },
        { href: '/blogs', label: 'Blogs', icon: '📰' },
        { href: '/gallery', label: 'Gallery', icon: '🖼️' },
      ],
    },
    {
      title: 'Content',
      items: [
        { href: '/topics', label: 'Topics', icon: '🏷️' },
        { href: '/ideas', label: 'Ideas', icon: '💡' },
        { href: '/templates', label: 'Templates', icon: '📋' },
        { href: '/resources', label: 'Resources', icon: '📚' },
        { href: '/studio/featured', label: 'Featured', icon: '🌟' },
        { href: '/studio/learn', label: 'Learn Page', icon: '📖' },
        { href: '/supportive-messages', label: 'Supportive Messages', icon: '💬' },
      ],
    },
    {
      title: 'Tools',
      items: [
        { href: '/generate', label: 'Generate', icon: '✨' },
        { href: '/settings', label: 'Settings', icon: '⚙️' },
      ],
    },
    {
      title: 'Community',
      items: [
        { href: '/studio/stories', label: 'Stories', icon: '📖' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white border border-gray-200 shadow-md hover:bg-gray-50 transition-transform"
        aria-label="Toggle menu"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40
          ${isMobileOpen ? 'w-64' : isCollapsed ? 'lg:w-16' : 'lg:w-64'} 
          w-64
          transform transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          overflow-y-auto
          flex flex-col
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Collapse Button */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            {!isCollapsed && (
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 hover:text-gray-700"
                onClick={() => setIsMobileOpen(false)}
              >
                CPTSD CMS
              </Link>
            )}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors ml-auto"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6">
            {menuItems.map((section) => (
              <div key={section.title}>
                {(!isCollapsed || isMobileOpen) && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={`
                          flex items-center ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'px-3'} py-2 text-sm font-medium rounded-md transition-colors group relative
                          ${
                            isActive(item.href)
                              ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                        title={isCollapsed && !isMobileOpen ? item.label : undefined}
                      >
                        <span className={`${isCollapsed && !isMobileOpen ? '' : 'mr-3'} text-lg`}>{item.icon}</span>
                        {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
                        {isCollapsed && !isMobileOpen && (
                          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* User Section */}
          {session && (
            <div className="p-4 border-t border-gray-200">
              {(!isCollapsed || isMobileOpen) && (
                <div className="px-3 py-2 text-sm text-gray-600 truncate mb-2">
                  {session.user?.email}
                </div>
              )}
              <button
                onClick={() => {
                  signOut();
                  setIsMobileOpen(false);
                }}
                className={`w-full ${isCollapsed && !isMobileOpen ? 'flex justify-center' : 'text-left'} px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors`}
                title={isCollapsed && !isMobileOpen ? 'Sign out' : undefined}
              >
                {isCollapsed && !isMobileOpen ? '🚪' : 'Sign out'}
              </button>
            </div>
          )}

          {/* New Post Button */}
          <div className="p-4 border-t border-gray-200">
            <Link
              href="/posts/new"
              onClick={() => setIsMobileOpen(false)}
              className={`block w-full btn btn-primary ${isCollapsed && !isMobileOpen ? 'flex justify-center' : 'text-center'}`}
              title={isCollapsed && !isMobileOpen ? 'New Post' : undefined}
            >
              {isCollapsed && !isMobileOpen ? '➕' : '+ New Post'}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

