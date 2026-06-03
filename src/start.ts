import { createStart, createMiddleware } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

import { renderErrorPage } from "./lib/error-page";

function isFrameworkControlFlow(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;
  // TanStack redirect/notFound objects, h3 HTTPError, and Response throws all
  // need to bubble up untouched so the framework can convert them to a proper
  // response (302 redirect, 404, etc.) instead of being swallowed as a 500.
  if (error instanceof Response) return true;
  const e = error as Record<string, unknown>;
  if ("statusCode" in e) return true;
  if ("isRedirect" in e || "isNotFound" in e) return true;
  if (e.options && typeof e.options === "object" && "statusCode" in (e.options as Record<string, unknown>)) return true;
  return false;
}

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (isFrameworkControlFlow(error)) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));
