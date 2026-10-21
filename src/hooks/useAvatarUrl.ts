import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { avatarObjectPath, signAvatarForUser, AVATAR_URL_LIFETIME_SECONDS } from "@/lib/avatarStorage";

export function useAvatarUrl(value: string | null | undefined) {
  const [resolved, setResolved] = useState<{ value: typeof value; url: string | null } | null>(null);
  useEffect(() => {
    let active = true;
    const path = avatarObjectPath(value, import.meta.env.VITE_SUPABASE_URL);
    const refresh = async () => {
      try {
        const url = await signAvatarForUser(supabase, path);
        if (active) setResolved({ value, url });
      } catch {
        if (active) setResolved({ value, url: null });
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, (AVATAR_URL_LIFETIME_SECONDS - 60) * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, [value]);
  return resolved?.value === value ? resolved.url : null;
}