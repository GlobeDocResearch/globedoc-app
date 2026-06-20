import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({ email: z.string().email() });

export const checkEmailExists = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
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
