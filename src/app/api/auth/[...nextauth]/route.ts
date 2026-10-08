import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { refreshAccessToken } from "@/features/auth/api/refresh-token.api";
import { isStaffRole } from "@/lib/access";
import { getApiBaseUrl } from "@/lib/api-url";

const baseUrl = getApiBaseUrl();

const loginResponseSchema = z.object({
  data: z.object({
    user: z.object({
      id: z.string().min(1),
      fullName: z.string(),
      email: z.string().email(),
      role: z.string(),
    }),
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresIn: z.number().positive(),
  }),
});

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const response = await fetch(baseUrl + "/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          const payload: unknown = await response.json();

          if (!response.ok) {
            throw new Error(getResponseMessage(payload) ?? "Login failed");
          }

          const parsed = loginResponseSchema.safeParse(payload);
          if (!parsed.success) {
            throw new Error("Invalid response from server");
          }

          const { user, accessToken, refreshToken, expiresIn } =
            parsed.data.data;
          if (!isStaffRole(user.role)) {
            throw new Error("This account does not have dashboard access");
          }

          return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            image: "",
            role: user.role,
            token: accessToken,
            refreshToken,
            expiresIn,
          };
        } catch (error) {
          throw error instanceof Error
            ? error
            : new Error("Invalid email or password");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          accessToken: user.token,
          refreshToken: user.refreshToken,
          accessTokenExpires: Date.now() + user.expiresIn * 1000,
        };
      }

      if (trigger === "update" && session) {
        return {
          ...token,
          name: session.user?.name ?? token.name,
          email: session.user?.email ?? token.email,
        };
      }

      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      try {
        const refreshedTokens = await refreshAccessToken(token.refreshToken);
        const profileResponse = await fetch(baseUrl + "/user/me", {
          headers: {
            Authorization: "Bearer " + refreshedTokens.accessToken,
          },
          cache: "no-store",
        });

        if (!profileResponse.ok) {
          throw new Error("Unable to verify account role");
        }

        const role = getProfileRole(await profileResponse.json());
        if (!isStaffRole(role)) {
          throw new Error("Dashboard access revoked");
        }

        return {
          ...token,
          role,
          accessToken: refreshedTokens.accessToken,
          accessTokenExpires: Date.now() + refreshedTokens.expiresIn * 1000,
          refreshToken: refreshedTokens.refreshToken,
        };
      } catch (error) {
        console.error("Error refreshing access token", error);
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        name: token.name,
        email: token.email,
        image: token.image,
        role: token.role,
      };
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };

function getProfileRole(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    return null;
  }

  const data = payload.data;
  return data && typeof data === "object" && "role" in data ? data.role : null;
}

function getResponseMessage(payload: unknown): string | null {
  return payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
    ? payload.message
    : null;
}
