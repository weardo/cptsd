import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// NextAuth v4 with App Router
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

