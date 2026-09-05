import { createRoute } from "#/lib/create-app";
import { searchRoute } from "./routes";
import { searchHandler } from "./handlers";

const router = createRoute().openapi(searchRoute, searchHandler);

export default router;
