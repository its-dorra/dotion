import { env } from "@notion-clone/env/web";
import { createAuthClient } from "better-auth/react";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

export const getAuthClient = createIsomorphicFn()
  .server(() => {
    const headers = getRequestHeaders();

    return createAuthClient({
      baseURL: env.VITE_SERVER_URL,

      fetchOptions: {
        credentials: "include",
        headers,
      },
    });
  })
  .client(() => {
    return createAuthClient({
      baseURL: env.VITE_SERVER_URL,
    });
  });
