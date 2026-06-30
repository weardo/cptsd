import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuthConfig } from './config';
import bcrypt from 'bcryptjs';
import connectDB from './mongodb';
import { User } from '@cptsd/db';

export const authOptions: NextAuthOptions = {
  // No adapter needed for JWT strategy - credentials are handled in authorize callback
  // MongoDB is used directly in the authorize function
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth] Missing credentials');
          return null;
        }

        await connectDB();
        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          console.log(`[Auth] User not found: ${credentials.email}`);
          return null;
        }

        if (!user.password) {
          console.log(`[Auth] User has no password: ${credentials.email}`);
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          console.log(`[Auth] Invalid password for: ${credentials.email}`);
          return null;
        }

        console.log(`[Auth] Successful login: ${credentials.email}`);
        const userDoc = user as any;
        return {
          id: userDoc._id.toString(),
          email: userDoc.email,
          name: userDoc.name || null,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: getAuthConfig().nextAuthSecret,
};

/**
 * Initialize admin user if it doesn't exist
 */
export async function initializeAdminUser() {
  const config = getAuthConfig();
  await connectDB();

  const existingUser = await User.findOne({ email: config.email });

  if (existingUser) {
    return existingUser;
  }

  const hashedPassword = await bcrypt.hash(config.password, 10);

  const adminUser = await User.create({
    email: config.email,
    password: hashedPassword,
    name: 'Admin',
  });

  return adminUser;
}
