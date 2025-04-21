import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { kv } from "../db/client";
import type { User, Session } from "../db/types";

// This function generates a random session token using the Web Crypto API.
export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

// This function creates a session for a user with a given token and userId.
export async function createSession(token: string, userId: User["id"]): Promise<Session> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  };

  await kv.set(["sessions", sessionId], session);

  return session;
}

// This function validates a session token by checking if it exists in the database and if it is not expired.
export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const { value: session } = await kv.get<Session>(["sessions", sessionId]);

  if (!session) {
    return { session: null, user: null };
  }

  const { value: user } = await kv.get<User>(["users", session.userId]);

  if (!user) {
    // The session exists, but the user does not, delete the session
    await kv.delete(["sessions", sessionId]);
    return { session: null, user: null };
  }

  // From here on, we know that the session and user exist
  const now = new Date();
  const fifteenDays = 1000 * 60 * 60 * 24 * 15;
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;

  // Check if the session is expired
  if (now.getTime() > session.expiresAt.getTime()) {
    await kv.delete(["sessions", sessionId]);
    return { session: null, user: null };
  }

  // Extend the session if it has less than 15 days left
  if (now.getTime() > session.expiresAt.getTime() - fifteenDays) {
    session.expiresAt = new Date(now.getTime() + thirtyDays);
    await kv.set(["sessions", sessionId], session);
  }

  return { session, user: user };
}

// This function invalidates a session by deleting it from the database.
export async function invalidateSession(sessionId: string): Promise<void> {
  await kv.delete(["sessions", sessionId]);
}

// This function invalidates all sessions for a user
export async function invalidateAllSessions(userId: User["id"]): Promise<void> {
  const sessionsList = kv.list<Session>({ prefix: ["sessions"] }); // Get all sessions
  for await (const session of sessionsList) {
    if (session.value.userId === userId) {
      await kv.delete(["sessions", session.value.id]); // Delete the session
    }
  }
}

export type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
