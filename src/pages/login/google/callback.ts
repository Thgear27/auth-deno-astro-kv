import type { APIContext } from "astro";
import { googleOAuthClient } from "../../../auth/outh/google";
import { google } from "googleapis";
import { addUser, getUserByEmail } from "../../../db/user";
import type { User } from "../../../db/types";
import { createSession, generateSessionToken } from "../../../auth/session";
import { setSessionTokenCookie } from "../../../auth/cookie";

export async function GET(context: APIContext): Promise<Response> {
  const storedState = context.cookies.get("google_oauth_state")?.value ?? null;
  const code = context.url.searchParams.get("code");
  const state = context.url.searchParams.get("state");

  if (storedState === null || code === null || state === null) {
    return new Response("Missing search params. Please restart the process.", {
      status: 400,
    });
  }

  if (storedState !== state) {
    return new Response("State doesn't match. Please restart the process.", {
      status: 400,
    });
  }

  const { tokens } = await googleOAuthClient.getToken(code);
  googleOAuthClient.setCredentials(tokens);

  const oauth2 = google.oauth2({
    auth: googleOAuthClient,
    version: "v2",
  });

  const { data: userinfo } = await oauth2.userinfo.get();
  console.log(userinfo);

  if (!userinfo.email || !userinfo.given_name || !userinfo.picture || !userinfo.id) {
    return new Response("Missing user info. Please restart the process.", {
      status: 400,
    });
  }

  const { value: exitingUser } = await getUserByEmail(userinfo.email);

  if (!exitingUser) {
    // Create a new user
    const newUser: User = {
      id: crypto.randomUUID(),
      email: userinfo.email,
      name: userinfo.given_name,
      avatarURL: userinfo.picture,
      createdAt: new Date(),
      googleId: userinfo.id,
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
    // User already exists
    // Check if the googleId matches
    if (exitingUser.googleId !== userinfo.id) {
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

  return new Response("Success", {
    status: 200,
  });
}
