export const AVATAR_URL_LIFETIME_SECONDS = 300;

// Existing profiles contain public URLs; new uploads store durable object paths.
export function avatarObjectPath(value: string | null | undefined, storageOrigin: string): string | null {
  if (!value) return null;
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.origin !== new URL(storageOrigin).origin) return null;
      const prefix = "/storage/v1/object/public/avatars/";
      if (!url.pathname.startsWith(prefix)) return null;
      path = decodeURIComponent(url.pathname.slice(prefix.length));
    } catch { return null; }
  }
  if (path.startsWith("/") || path.includes("\\") || path.includes(":") || path.split("/").some(p => !p || p === "." || p === "..")) return null;
  return path.includes("/") ? path : null;
}

export async function signAvatarForUser(
  client: {
    auth: { getUser: () => Promise<{ data: { user: unknown }; error?: unknown }> };
    storage: { from: (bucket: string) => { createSignedUrl: (path: string, seconds: number) => Promise<{ data: { signedUrl: string } | null; error: unknown }> } };
  },
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (!user || authError) return null;
  const { data, error } = await client.storage.from("avatars").createSignedUrl(path, AVATAR_URL_LIFETIME_SECONDS);
  return error ? null : data?.signedUrl ?? null;
}