import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export default NextAuth({
  providers: [
    // Google provider - primary authentication method
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
        token.sub = user.id;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        (session.user as any).sub = token.sub;
        (session.user as any).provider = token.provider;
      }
      return session;
    },
  },
  events: {
    signIn({ user, account, profile }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`);
    },
  },
});
