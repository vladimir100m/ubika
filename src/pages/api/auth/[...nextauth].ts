import NextAuth, { type AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

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
      return session;
    },
  },
  events: {
    signIn({ user, account }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`);
    },
  },
};

export default NextAuth(authOptions);
