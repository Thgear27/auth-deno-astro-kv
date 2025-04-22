import { beforeEach, expect, test } from "vitest";
import type { User } from "../db/types";
import { addUser, getUser, updateUser, deleteUser } from "../db/user";

const testUser: User = {
  id: "test-user-id",
  name: "Test User",
  email: "test@test.com",
  createdAt: new Date(),
};

let kv: Deno.Kv;

beforeEach(async () => {
  kv = await Deno.openKv(":memory:");
});

test("It should add a user", async () => {
  await addUser(kv, testUser);

  const { value: storedUser } = await kv.get<User>(["users", testUser.id]);

  if (!storedUser) {
    throw new Error("User not found");
  }

  expect(storedUser).toEqual(testUser);
});

test("It should get a user", async () => {
  await addUser(kv, testUser);

  const { error, value: user } = await getUser(kv, testUser.id);

  if (error) {
    throw new Error(error.message);
  }

  expect(user).toEqual(testUser);
});

test("It should update a user", async () => {
  const updatedUser = { ...testUser, name: "Updated Test User" };

  await addUser(kv, testUser);
  const { error } = await updateUser(kv, { name: updatedUser.name }, testUser.id);

  if (error) {
    throw new Error(error.message);
  }

  const { value: storedUser } = await getUser(kv, testUser.id);

  if (!storedUser) {
    throw new Error("User not found");
  }

  expect(storedUser).toEqual(updatedUser);
});

test("It should delete a user", async () => {
  await addUser(kv, testUser);

  const { value: userBeforeDelete } = await getUser(kv, testUser.id);
  if (!userBeforeDelete) {
    throw new Error("User not found");
  }

  await deleteUser(kv, testUser.id);
  const { value: userAfterDelete } = await getUser(kv, testUser.id);

  expect(userAfterDelete).toBeNull();
});
