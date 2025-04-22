import { beforeEach, expect, test } from "vitest";
import type { Session } from "../db/types";
import { addSession, updateSession, getSession, deleteSession, deleteSessionsByUserId } from "../db/session";

let kv: Deno.Kv;

beforeEach(async () => {
  kv = await Deno.openKv(":memory:");
});

const testSession: Session = {
  id: "test-session-id",
  userId: "test-user-id",
  expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
};

test("It should create a session", async () => {
  await addSession(kv, testSession);

  const { value: storedSession } = await kv.get<Session>(["sessions", testSession.id]);

  if (!storedSession) {
    throw new Error("Session not found");
  }

  expect(storedSession).toEqual(testSession);
});

test("It should update a session", async () => {
  const updatedSession = { ...testSession, expiresAt: new Date(Date.now() + 1000 * 60 * 120) }; // 2 hours from now

  await addSession(kv, testSession);
  const { error } = await updateSession(kv, updatedSession, testSession.id);

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
  await addSession(kv, testSession);
  const { error, value: session } = await getSession(kv, testSession.id);

  if (error) {
    throw new Error(error.message);
  }

  expect(session).toEqual(testSession);
});

test("It should delete a session", async () => {
  await addSession(kv, testSession);

  const { value: sessionBeforeDelete } = await getSession(kv, testSession.id);

  if (!sessionBeforeDelete) {
    throw new Error("Session not found");
  }

  await deleteSession(kv, testSession.id);

  const { value: sessionAfterDelete } = await getSession(kv, testSession.id);

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

  await addSession(kv, session1); // This session will be deleted
  await addSession(kv, session2); // This session will be deleted
  await addSession(kv, session3); // This session will not be deleted

  const { error } = await deleteSessionsByUserId(kv, "user-id");

  if (error) {
    throw new Error(error.message);
  }

  const { value: deletedSession1 } = await getSession(kv, session1.id);
  const { value: deletedSession2 } = await getSession(kv, session2.id);
  const { value: notDeletedSession } = await getSession(kv, session3.id);

  expect(deletedSession1).toBeNull();
  expect(deletedSession2).toBeNull();
  expect(notDeletedSession).toEqual(session3);
});
