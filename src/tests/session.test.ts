import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Session } from "../db/types";
import {
  addSession,
  updateSession,
  getSession,
  deleteSession,
  deleteSessionsByUserId,
} from "../db/session";
import { kv } from "../db/client";

const testSession: Session = {
  id: "test-session-id",
  userId: "test-user-id",
  expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
};

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

test("It should create a session", async () => {
  await addSession(testSession);

  const { value: storedSession } = await kv.get<Session>(["sessions", testSession.id]);

  if (!storedSession) {
    throw new Error("Session not found");
  }

  expect(storedSession).toEqual(testSession);
});

test("It should update a session", async () => {
  const updatedSession = {
    ...testSession,
    expiresAt: new Date(Date.now() + 1000 * 60 * 120),
  }; // 2 hours from now

  await addSession(testSession);
  const { error } = await updateSession(updatedSession, testSession.id);

  if (error) {
    throw new Error(error.message);
  }

  const { value: storedSession } = await kv.get<Session>(["sessions", testSession.id]);

  if (!storedSession) {
    throw new Error("Session not found");
  }

  expect(storedSession).toEqual(updatedSession);
});

test("It should get a session", async () => {
  await addSession(testSession);
  const { error, value: session } = await getSession(testSession.id);

  if (error) {
    throw new Error(error.message);
  }

  expect(session).toEqual(testSession);
});

test("It should delete a session", async () => {
  await addSession(testSession);

  const { value: sessionBeforeDelete } = await getSession(testSession.id);

  if (!sessionBeforeDelete) {
    throw new Error("Session not found");
  }

  await deleteSession(testSession.id);

  const { value: sessionAfterDelete } = await getSession(testSession.id);

  expect(sessionAfterDelete).toBeNull();
});

test("It should delete all session by user id", async () => {
  const session1: Session = {
    id: "test-session-id-1",
    userId: "user-id",
    expiresAt: new Date(),
  };

  const session2: Session = {
    id: "test-session-id-2",
    userId: "user-id",
    expiresAt: new Date(),
  };

  const session3: Session = {
    id: "test-session-id-3",
    userId: "different-user-id",
    expiresAt: new Date(),
  };

  await addSession(session1); // This session will be deleted
  await addSession(session2); // This session will be deleted
  await addSession(session3); // This session will not be deleted

  const { error } = await deleteSessionsByUserId("user-id");

  if (error) {
    throw new Error(error.message);
  }

  const { value: deletedSession1 } = await getSession(session1.id);
  const { value: deletedSession2 } = await getSession(session2.id);
  const { value: notDeletedSession } = await getSession(session3.id);

  expect(deletedSession1).toBeNull();
  expect(deletedSession2).toBeNull();
  expect(notDeletedSession).toEqual(session3);
});
