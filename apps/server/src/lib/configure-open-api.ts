import { Scalar } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "#/lib/types";

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc31("/api/doc", {
    openapi: "3.1.0",
    info: {
      version: "1.0.0",
      title: "Dotion API",
    },
  });

  app.get(
    "/api/reference",
    Scalar({
      pageTitle: "Dotion API reference",
      theme: "bluePlanet",
      layout: "modern",
      darkMode: true,
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
      sources: [
        { url: "/api/auth/open-api/generate-schema", title: "Auth" },
        {
          url: "/api/doc",
          title: "Dotion API",
        },
      ],
    }),
  );
}
