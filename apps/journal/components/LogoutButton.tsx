'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
    >
      Sign out
    </button>
  );
}



