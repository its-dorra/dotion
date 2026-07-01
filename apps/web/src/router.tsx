import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { routeTree } from "./routeTree.gen";
import { Provider } from "./integrations/tanstack-query/root-provider";
import { getRouterContext } from "./integrations/router-context";
import { deLocalizeUrl, localizeUrl } from "./paraglide/runtime.js";

export const getRouter = () => {
  const routerContext = getRouterContext();

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: {
      ...routerContext,
    },
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizeUrl(url),
    },
    defaultNotFoundComponent: () => <div>Not Found</div>,
    Wrap: (props: { children: React.ReactNode }) => (
      <Provider queryClient={routerContext.queryClient}>
        {props.children}
      </Provider>
    ),
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: routerContext.queryClient,
  });

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
