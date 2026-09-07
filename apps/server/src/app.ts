import { createApp } from "./lib/create-app";
import workspaceRouter from "./routes/workspaces";
import userRouter from "./routes/users";
import notificationRouter from "./routes/notifications";
import authorizationRouter from "./routes/authorization";

const app = createApp()
  .route("/api/v1/workspaces", workspaceRouter)
  .route("/api/v1/users", userRouter)
  .route("/api/v1/notifications", notificationRouter)
  .route("/api/v1/authorization", authorizationRouter);

app.on(["POST", "GET"], "/api/auth/*", (c) => c.var.auth.handler(c.req.raw));
app.get("/", (c) => c.text("Dotion API Server is running!"));
app.get("/health", (c) => c.text("OK"));

export default app;
