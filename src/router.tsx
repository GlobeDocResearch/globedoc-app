import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (
      (host === "globedoc.com" || host === "www.globedoc.com") &&
      window.location.pathname !== "/launch"
    ) {
      window.location.replace("/launch");
    }
  }

  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
