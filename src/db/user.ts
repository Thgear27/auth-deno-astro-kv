import { kv } from "./client";
import type { Result, User } from "./types";

type UserResult = Result<User>;

export async function addUser(user: User): Promise<UserResult> {
  await kv.set(["users", user.id], user);
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

export async function deleteUser(id: User["id"]) {
  await kv.delete(["users", id]);
}
