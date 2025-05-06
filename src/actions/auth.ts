import { z } from "astro/zod";
import { ActionError, defineAction } from "astro:actions";
import { addUser, getUserByEmail } from "../db/user";
import { hash, verify } from "@node-rs/argon2";
import { createSession, generateSessionToken, invalidateSession } from "../auth/session";
import {
  deleteSessionTokenCookie,
  setSessionTokenCookie,
} from "../auth/cookie";

export const login = defineAction({
  accept: "form",
  input: z.object({
    email: z.string().email(),
    password: z.string().min(3).max(100),
  }),
  handler: async (input, ctx) => {
    const { email, password } = input;

    const { error, value: user } = await getUserByEmail(email);

    if (error) {
      throw new ActionError({
        code: "UNAUTHORIZED",
        message: error.message,
      });
    }

    if (!user.passwordHash) {
      throw new ActionError({
        code: "UNAUTHORIZED",
        message: "No password set, use another method to login",
      });
    }

    const isPasswordValid = await verify(user.passwordHash, password);

    if (!isPasswordValid) {
      throw new ActionError({
        code: "UNAUTHORIZED",
        message: "Invalid password",
      });
    }

    const token = generateSessionToken();
    const session = await createSession(token, user.id);

    if (!session) {
      throw new ActionError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create session",
      });
    }

    setSessionTokenCookie(ctx, token, session.expiresAt);
  },
});

export const register = defineAction({
  accept: "form",
  input: z.object({
    email: z.string().email(),
    username: z.string().min(3).max(20),
    password: z.string().min(3).max(100),
    confirmPassword: z.string().min(3).max(100),
  }),
  handler: async (input) => {
    const passwordHash = await hash(input.password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    await addUser({
      email: input.email,
      name: input.username,
      passwordHash: passwordHash,
      createdAt: new Date(),
      id: crypto.randomUUID(),
    });
  },
});

export const logout = defineAction({
  accept: "form",
  input: z.object({
    email: z.string().email(),
  }),
  handler: async (input, ctx) => {
    const { email } = input;
    const { error, value: user } = await getUserByEmail(email);

    if (error) {
      throw new ActionError({
        code: "UNAUTHORIZED",
        message: error.message,
      });
    }

    if (!ctx.locals.session) {
      throw new ActionError({
        code: "UNAUTHORIZED",
        message: "No session found",
      });
    }

    deleteSessionTokenCookie(ctx);
    await invalidateSession(ctx.locals.session.id);
  },
});
