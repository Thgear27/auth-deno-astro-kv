import type { Result, User } from "./types";

type UserResult = Result<User>;

export async function addUser(kv: Deno.Kv, user: User): Promise<UserResult> {
  await kv.set(["users", user.id], user);
  return { error: null, value: user };
}

export async function updateUser(kv: Deno.Kv, user: Partial<User>, id: User["id"]): Promise<UserResult> {
  const { value: currentUser } = await kv.get<User>(["users", id]);
  if (!currentUser) {
    return { error: { message: "User not found" }, value: null };
  }

  const userUpdated = { ...currentUser, ...user };
  await kv.set(["users", id], userUpdated);
  return { error: null, value: userUpdated };
}

export async function getUser(kv: Deno.Kv, id: User["id"]): Promise<UserResult> {
  const { value: user } = await kv.get<User>(["users", id]);

  if (!user) {
    return { error: { message: "User not found" }, value: null };
  }

  return { error: null, value: user };
}

export async function deleteUser(kv: Deno.Kv, id: User["id"]) {
  await kv.delete(["users", id]);
}
