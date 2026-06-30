'use client';

import { useSidebar } from './SidebarProvider';

export default function SidebarContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={`min-h-screen bg-gray-50 transition-all duration-300 ${
        isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}
    >
      {children}
    </main>
  );
}

