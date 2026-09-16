import { createApp } from "./lib/create-app";
import { rateLimit } from "#/middlewares/rate-limit-middleware";
import workspaceRouter from "./routes/workspaces";
import userRouter from "./routes/users";
import notificationRouter from "./routes/notifications";
import authorizationRouter from "./routes/authorization";

const app = createApp()
  .use(
    "/api/auth/*",
    rateLimit({
      limiter: (env) => env.AUTH_RATE_LIMITER,
      skip: (c) => {
        const path = c.req.path;
        return path.endsWith("/get-session") || path.endsWith("/ok");
      },
      keyGenerator: (c) => {
        const ip =
          c.req.header("cf-connecting-ip") ??
          c.req.header("x-forwarded-for") ??
          "unknown-ip";
        return `${ip}:${c.req.path}`;
      },
      errorMessage: "Too many authentication requests. Please try again later.",
    }),
  )
  .route("/api/v1/workspaces", workspaceRouter)
  .route("/api/v1/users", userRouter)
  .route("/api/v1/notifications", notificationRouter)
  .route("/api/v1/authorization", authorizationRouter);

app.on(["POST", "GET"], "/api/auth/*", (c) => c.var.auth.handler(c.req.raw));
app.get("/", (c) => c.text("Dotion API Server is running!"));
app.get("/health", (c) => c.text("OK"));

export default app;
