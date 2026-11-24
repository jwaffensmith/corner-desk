import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import type { AppAuth } from "./app.js";
import { prisma } from "./db.js";
import { provisionUser } from "./services/provision.js";

// Any Better Auth social provider can be listed here. Each one turns on when
// <NAME>_CLIENT_ID and <NAME>_CLIENT_SECRET are set.
const PROVIDERS = ["google", "github"] as const;

const socialProviders = Object.fromEntries(
  PROVIDERS.flatMap((id) => {
    const clientId = process.env[`${id.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${id.toUpperCase()}_CLIENT_SECRET`];
    return clientId && clientSecret ? [[id, { clientId, clientSecret }]] : [];
  }),
);

const allowedEmails = new Set(
  (process.env.ALLOWED_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean),
);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders,
  user: {
    validateUserInfo: ({ user }) => {
      if (allowedEmails.size && !allowedEmails.has(String(user.email).toLowerCase())) {
        return { error: "not_invited", errorDescription: "This email has not been invited yet" };
      }
    },
  },
  databaseHooks: {
    user: { create: { after: (user) => provisionUser(user.id) } },
  },
});

export const appAuth: AppAuth = {
  providers: Object.keys(socialProviders),
  handler: toNodeHandler(auth),
  userId: async (req) => {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    return session?.user.id ?? null;
  },
};
