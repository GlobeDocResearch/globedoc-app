import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";

export const getCurrentRequestHost = createServerFn({ method: "GET" }).handler(() => {
  try {
    return getRequestHost({ xForwardedHost: true }) ?? "";
  } catch {
    return "";
  }
});