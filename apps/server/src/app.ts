import { createApp } from "./lib/create-app";
import workspaceRouter from "./routes/workspaces";
import userRouter from "./routes/users";
import notificationRouter from "./routes/notifications";
import authorizationRouter from "./routes/authorization";

const app = createApp()
  .basePath("/api")
  .route("v1/workspaces", workspaceRouter)
  .route("v1/users", userRouter)
  .route("v1/notifications", notificationRouter)
  .route("v1/authorization", authorizationRouter);

app.on(["POST", "GET"], "/auth/*", (c) => c.var.auth.handler(c.req.raw));
app.get("/", (c) => c.text("Dotion API Server is running!"));
app.get("/health", (c) => c.text("OK"));

export default app;
