import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  createSession,
  generateSessionToken,
  invalidateAllSessions,
  invalidateSession,
  validateSessionToken,
} from "../auth/api";
import type { Session, User } from "../db/types";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { getSession, updateSession } from "../db/session";
import { addUser } from "../db/user";

const testUser: User = {
  id: "test-user-id",
  name: "Test User",
  email: "test@test.com",
  createdAt: new Date(),
};

// This token should be binded to the session id
const testToken = "xuswq6x44jbshhhvkfgoxkhabdfrqf3b";
// The session id is the sha256 hash of the token
const encodedSessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(testToken)));

let memoryKv: Deno.Kv;

// Mock the Deno.openKv function to use an in-memory database
vi.mock("../db/client", async () => {
  return {
    get kv() {
      return memoryKv;
    },
  };
});

beforeEach(async () => {
  memoryKv = await Deno.openKv(":memory:");
});

afterEach(async () => {
  memoryKv.close();
});

test("It should generate a session token", () => {
  const token = generateSessionToken();
  expect(token).toBeDefined();
  expect(token).toMatch(/^[a-z2-7]+$/);
  expect(token.length).toBe(32);
});

test("It should create a session", async () => {
  const session = await createSession(testToken, testUser.id);
  if (!session) throw new Error("Session not created");

  expect(session.id).toBe(encodedSessionId);

  const { error, value: storedSession } = await getSession(session.id);
  if (error) throw new Error("Session not found");

  expect(storedSession).toBeDefined();
  expect(storedSession.id).toBe(session.id);
  expect(storedSession.userId).toBe(testUser.id);
  expect(storedSession.expiresAt).toBeInstanceOf(Date);
  expect(storedSession.expiresAt.getTime()).toBeGreaterThan(Date.now());
});

test("It should invalidate a session when expired", async () => {
  await addUser(testUser);

  const session = await createSession(testToken, testUser.id);
  if (!session) throw new Error("Session not created");

  const oneDay = 1000 * 60 * 60 * 24;

  // Simulate session expiration
  session.expiresAt = new Date(Date.now() - oneDay); // Sets the expiration date to 1 day ago

  await updateSession(session, session.id);

  await validateSessionToken(testToken);

  const { value: invalidatedSession } = await getSession(session.id);
  expect(invalidatedSession).toBeNull();
});

test("It should expand a session 30 days", async () => {
  await addUser(testUser);

  const session = await createSession(testToken, testUser.id);
  if (!session) throw new Error("Session not created");

  const time = 1000 * 60 * 60 * 24 * 29; // 29 days

  // Simulate session is about to expire
  session.expiresAt = new Date(session.expiresAt.getTime() - time);
  await updateSession(session, session.id);

  const { session: expandedSession } = await validateSessionToken(testToken);
  expect(expandedSession).not.toBeNull();
});

test("It should invalidate a session if user does not exist", async () => {
  const session = await createSession(testToken, testUser.id);
  if (!session) throw new Error("Session not created");

  const { value: storedSession } = await getSession(session.id);
  if (!storedSession) throw new Error("Session not found");

  await validateSessionToken(testToken);

  const { value: deletedSession } = await getSession(storedSession.id);
  expect(deletedSession).toBeNull();
});

test("It should invalidate a session", async () => {
  await addUser(testUser);

  const session = await createSession(testToken, testUser.id);
  if (!session) throw new Error("Session not created");

  await invalidateSession(session.id);

  const { value: deletedSession } = await getSession(session.id);
  expect(deletedSession).toBeNull();
});

test("It should invalidate all sessions for a user", async () => {
  await addUser(testUser);
  await addUser({ ...testUser, id: "test-user-id-2" });
  const token1 = generateSessionToken();
  const token2 = generateSessionToken();
  const token3 = generateSessionToken();
  const token4 = generateSessionToken();

  const session1 = await createSession(token1, testUser.id);
  const session2 = await createSession(token2, testUser.id);
  const session3 = await createSession(token3, testUser.id);
  const session4 = await createSession(token4, "test-user-id-2");

  if (!session1 || !session2 || !session3 || !session4) throw new Error("Session not created");

  await invalidateAllSessions(testUser.id);

  const { value: deletedSession1 } = await getSession(session1.id);
  expect(deletedSession1).toBeNull();

  const { value: deletedSession2 } = await getSession(session2.id);
  expect(deletedSession2).toBeNull();

  const { value: deletedSession3 } = await getSession(session3.id);
  expect(deletedSession3).toBeNull();

  const { value: deletedSession4 } = await getSession(session4.id);
  expect(deletedSession4).not.toBeNull(); // Should not be deleted
});
