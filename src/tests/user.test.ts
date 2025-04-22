import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { User } from "../db/types";
import { addUser, getUser, updateUser, deleteUser } from "../db/user";
import { kv } from "../db/client";

const testUser: User = {
  id: "test-user-id",
  name: "Test User",
  email: "test@test.com",
  createdAt: new Date(),
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

test("It should add a user", async () => {
  await addUser(testUser);

  const { value: storedUser } = await kv.get<User>(["users", testUser.id]);

  if (!storedUser) {
    throw new Error("User not found");
  }

  expect(storedUser).toEqual(testUser);
});

test("It should get a user", async () => {
  await addUser(testUser);

  const { error, value: user } = await getUser(testUser.id);

  if (error) {
    throw new Error(error.message);
  }

  expect(user).toEqual(testUser);
});

test("It should update a user", async () => {
  const updatedUser = { ...testUser, name: "Updated Test User" };

  await addUser(testUser);
  const { error } = await updateUser({ name: updatedUser.name }, testUser.id);

  if (error) {
    throw new Error(error.message);
  }

  const { value: storedUser } = await getUser(testUser.id);

  if (!storedUser) {
    throw new Error("User not found");
  }

  expect(storedUser).toEqual(updatedUser);
});

test("It should delete a user", async () => {
  await addUser(testUser);

  const { value: userBeforeDelete } = await getUser(testUser.id);
  if (!userBeforeDelete) {
    throw new Error("User not found");
  }

  await deleteUser(testUser.id);
  const { value: userAfterDelete } = await getUser(testUser.id);

  expect(userAfterDelete).toBeNull();
});
