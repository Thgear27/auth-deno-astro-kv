import type { APIContext } from "astro";
import { addUser, getUserByEmail } from "../../../db/user";
import type { User } from "../../../db/types";
import { createSession, generateSessionToken } from "../../../auth/session";
import { setSessionTokenCookie } from "../../../auth/cookie";
import { decodeIdToken, type OAuth2Tokens } from "arctic";
import { google } from "../../../auth/oauth/google";
import { z } from "zod";

export async function GET(context: APIContext): Promise<Response> {
  const storedState = context.cookies.get("google_oauth_state")?.value ?? null;
  const storedCodeVerifier = context.cookies.get("google_code_verifier")?.value ?? null;
  const code = context.url.searchParams.get("code");
  const state = context.url.searchParams.get("state");

  if (storedState === null || code === null || state === null || storedCodeVerifier === null) {
    return new Response("Missing search params. Please restart the process.", {
      status: 400,
    });
  }

  if (storedState !== state) {
    return new Response("State doesn't match. Please restart the process.", {
      status: 400,
    });
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
  } catch (e) {
    return new Response("Code verifier doesn't macht. Please restart the process.", {
      status: 400,
    });
  }

  const idTokenClaims = decodeIdToken(tokens.idToken());
  const userInfoSchema = z.object({
    sub: z.string(),
    email: z.string().email(),
    name: z.string(),
    picture: z.string(),
    given_name: z.string(),
    family_name: z.string(),
  });

  const { success, data: userInfo } = userInfoSchema.safeParse(idTokenClaims);

  if (!success) {
    return new Response("Invalid user info", {
      status: 400,
    });
  }

  const { value: exitingUser } = await getUserByEmail(userInfo.email);

  if (!exitingUser) {
    // Create a new user
    const newUser: User = {
      id: crypto.randomUUID(),
      email: userInfo.email,
      name: userInfo.given_name,
      avatarURL: userInfo.picture,
      createdAt: new Date(),
      googleId: userInfo.sub,
    };

    await addUser(newUser);

    const token = generateSessionToken();
    const session = await createSession(token, newUser.id);

    if (!session) {
      return new Response("Failed to create session", {
        status: 500,
      });
    }

    setSessionTokenCookie(context, token, session.expiresAt);
  } else {
    // User already exists, check if the googleId matches
    if (exitingUser.googleId !== userInfo.sub) {
      return new Response("Google ID doesn't match. User has an account with Email and Password", {
        status: 400,
      });
    }

    const token = generateSessionToken();
    const session = await createSession(token, exitingUser.id);
    if (!session) {
      return new Response("Failed to create session", {
        status: 500,
      });
    }
    setSessionTokenCookie(context, token, session.expiresAt);
  }

  return context.redirect("/");
}
