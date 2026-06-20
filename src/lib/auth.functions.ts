import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const checkEmailExists = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const client = supabaseAdmin as any;
    const { data: users, error } = await client
      .schema("auth")
      .from("users")
      .select("id")
      .eq("email", data.email)
      .limit(1);

    if (error) throw new Error(error.message);
    return { exists: Array.isArray(users) && users.length > 0 };
  });
