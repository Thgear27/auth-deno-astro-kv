import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import type { User, Session } from "../db/types";
import {
  addSession,
  deleteSession,
  deleteSessionsByUserId,
  getSession,
  updateSession,
} from "../db/session";
import { getUser } from "../db/user";

// This function generates a random session token using the Web Crypto API.
export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

// This function creates a session for a user with a given token and userId.
export async function createSession(token: string, userId: User["id"]): Promise<Session | null> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  };

  const { error } = await addSession(session);

  if (error) {
    return null;
  }

  return session;
}

// This function validates a session token by checking if it exists in the database and if it is not expired.
export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const { value: session } = await getSession(sessionId);

  if (!session) {
    return { session: null, user: null };
  }

  const { value: user } = await getUser(session.userId);

  if (!user) {
    // The session exists, but the user does not, delete the session
    console.log(`[LOG]: User not found, deleting session with id: ${sessionId}`);
    await deleteSession(sessionId);
    return { session: null, user: null };
  }

  // From here on, we know that the session and user exist
  const now = new Date();
  const fifteenDays = 1000 * 60 * 60 * 24 * 15;
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;

  // Check if the session is expired
  if (now.getTime() > session.expiresAt.getTime()) {
    console.log(`[LOG]: Session expired, deleting session with id: ${sessionId}`);
    await deleteSession(sessionId);
    return { session: null, user: null };
  }

  // Extend the session if it has less than 15 days left
  if (now.getTime() > session.expiresAt.getTime() - fifteenDays) {
    console.log(`[LOG]: Session extended. Session id: ${sessionId}`);
    session.expiresAt = new Date(now.getTime() + thirtyDays);
    await updateSession(session, sessionId);
  }

  return { session, user: user };
}

// This function invalidates a session by deleting it from the database.
export async function invalidateSession(sessionId: string): Promise<void> {
  await deleteSession(sessionId);
}

// This function invalidates all sessions for a user
export async function invalidateAllSessions(userId: User["id"]): Promise<void> {
  await deleteSessionsByUserId(userId);
}

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };
