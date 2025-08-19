import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

export default NextAuth({
  providers: [
    // Google provider - primary authentication method
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Development credentials provider (fallback)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // For development - accept any email/password
        if (credentials?.email && credentials?.password) {
          return {
            id: "dev-user",
            name: credentials.email.split('@')[0],
            email: credentials.email,
            image: null,
          };
        }
        return null;
      }
    })
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
    async signIn({ user, account, profile }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`);
    },
  },
});
