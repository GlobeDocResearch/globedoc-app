import { test, expect } from "bun:test";
import { avatarObjectPath, signAvatarForUser } from "./avatarStorage.ts";

test("anonymous users cannot obtain avatar signed URLs", async () => {
  let signed = false;
  const client = { auth: { getUser: async () => ({ data: { user: null } }) }, storage: { from: () => ({ createSignedUrl: async () => { signed = true; return { data: { signedUrl: "signed" }, error: null }; } }) } };
  expect(await signAvatarForUser(client, "owner/avatar.png")).toBeNull();
  expect(signed).toBe(false);
});
test("signed-in avatar requests use the private bucket and a short-lived signed URL", async () => {
  const calls = [];
  const client = { auth: { getUser: async () => ({ data: { user: { id: "owner" } } }) }, storage: { from: bucket => ({ createSignedUrl: async (path, seconds) => { calls.push([bucket, path, seconds]); return { data: { signedUrl: "temporary-signed-url" }, error: null }; } }) } };
  expect(await signAvatarForUser(client, "owner/avatar.png")).toBe("temporary-signed-url");
  expect(calls).toEqual([["avatars", "owner/avatar.png", 300]]);
});
test("legacy avatar URLs resolve only from the configured storage origin", () => {
  const origin = "https://storage.example.org";
  expect(avatarObjectPath(origin + "/storage/v1/object/public/avatars/owner/avatar.png", origin)).toBe("owner/avatar.png");
  expect(avatarObjectPath("https://untrusted.example/storage/v1/object/public/avatars/owner/avatar.png", origin)).toBeNull();
  expect(avatarObjectPath("owner/../secret", origin)).toBeNull();
});