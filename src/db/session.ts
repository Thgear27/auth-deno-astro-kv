import type { Result, Session } from "./types";

export type SessionResult = Result<Session>;

export async function addSession(kv: Deno.Kv, session: Session): Promise<SessionResult> {
  const key: Deno.KvKey = ["sessions", session.id];
  await kv.set(key, session);
  await kv.set(["sessionsByUserId", session.userId, session.id], key); // https://docs.deno.com/deploy/kv/manual/#improve-querying-with-secondary-indexes
  return { error: null, value: session };
}

export async function updateSession(
  kv: Deno.Kv,
  session: Partial<Session>,
  id: Session["id"]
): Promise<SessionResult> {
  const { value: currentSession } = await kv.get<Session>(["sessions", id]);
  if (!currentSession) {
    return { error: { message: "Session not found" }, value: null };
  }

  const sessionUpdate = { ...currentSession, ...session };
  await kv.set(["sessions", id], sessionUpdate);
  return { error: null, value: sessionUpdate };
}

export async function getSession(kv: Deno.Kv, id: Session["id"]): Promise<SessionResult> {
  const { value: session } = await kv.get<Session>(["sessions", id]);

  if (!session) {
    return { error: { message: "Session not found" }, value: null };
  }

  return { error: null, value: session };
}

export async function deleteSession(kv: Deno.Kv, id: Session["id"]) {
  await kv.delete(["sessions", id]);
}

export async function deleteSessionsByUserId(
  kv: Deno.Kv,
  userId: Session["userId"]
): Promise<Result<null>> {
  try {
    const sessionKeys = kv.list<Deno.KvKey>({
      prefix: ["sessionsByUserId", userId],
    });

    for await (const sessionKey of sessionKeys) {
      const { value: session } = await kv.get<Session>(sessionKey.value);
      if (session) {
        await kv.delete(["sessions", session.id]);
      }
    }

    return { error: null, value: null };
  } catch (err) {
    return {
      error: { message: "Error deleting sessions by user id" },
      value: null,
    };
  }
}
