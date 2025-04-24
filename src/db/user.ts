import { kv } from "./client";
import type { Result, User } from "./types";

type UserResult = Result<User>;

export async function addUser(user: User): Promise<UserResult> {
  const { value: existingUser } = await getUserByEmail(user.email);
  if (existingUser) {
    return { error: { message: "User already exists" }, value: null }
  }

  const key: Deno.KvKey = ["users", user.id];
  await kv.set(key, user);
  await kv.set(["usersByEmail", user.email], key); // https://docs.deno.com/deploy/kv/manual/#improve-querying-with-secondary-indexes
  return { error: null, value: user };
}

export async function updateUser(user: Partial<User>, id: User["id"]): Promise<UserResult> {
  const { value: currentUser } = await kv.get<User>(["users", id]);
  if (!currentUser) {
    return { error: { message: "User not found" }, value: null };
  }

  const userUpdated = { ...currentUser, ...user };
  await kv.set(["users", id], userUpdated);
  return { error: null, value: userUpdated };
}

export async function getUser(id: User["id"]): Promise<UserResult> {
  const { value: user } = await kv.get<User>(["users", id]);

  if (!user) {
    return { error: { message: "User not found" }, value: null };
  }

  return { error: null, value: user };
}

export async function getUserByEmail(email: User["email"]): Promise<UserResult> {
  const { value: userKey } = await kv.get<Deno.KvKey>(["usersByEmail", email]);
  if (!userKey) {
    return { error: { message: "User not found" }, value: null };
  }

  const { value: user } = await kv.get<User>(userKey);
  if (!user) {
    return { error: { message: "User not found" }, value: null };
  }

  return { error: null, value: user };
}

export async function deleteUser(id: User["id"]) {
  await kv.delete(["users", id]);
}
