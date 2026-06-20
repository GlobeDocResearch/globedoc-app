import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({ email: z.string().email() });

export const checkEmailExists = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) throw new Error(error.message);
    const emailLower = data.email.toLowerCase().trim();
    const exists = (list.users || []).some(
      (u: any) => (u.email ?? "").toLowerCase().trim() === emailLower,
    );
    return { exists };
  });
