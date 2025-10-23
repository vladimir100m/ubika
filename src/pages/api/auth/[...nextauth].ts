import NextAuth, { type AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { cacheSet, cacheDel } from '../../../lib/cache';
import { cacheSession, deleteCachedSession } from '../../../lib/sessionCache';

// Export a shared authOptions object so other API routes can reliably access session state.
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = (user as any).id ?? (user as any).sub ?? token.sub;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        (session.user as any).sub = token.sub;
        (session.user as any).provider = (token as any).provider;
      }
      try {
        const id = (session.user as any).sub ?? session.user?.email;
        if (id) await cacheSession(id, session);
      } catch (e) {
        console.error('Failed to cache session', e);
      }
      return session;
    },
  },
  events: {
    signIn({ user, account }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`);
    },
    signOut({ token }) {
      // Attempt to clear cached session on sign out
      try {
        const sub = (token as any)?.sub;
        if (sub) deleteCachedSession(sub).catch((e) => console.error('Failed to delete session cache', e));
      } catch (e) {
        console.error('Error during signOut cache cleanup', e);
      }
    },
  },
};

export default NextAuth(authOptions);
