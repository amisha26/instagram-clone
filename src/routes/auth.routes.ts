import { OpenAPIHono } from "@hono/zod-openapi";
import { register } from "../controller/auth.controller";

const authRoutes = new OpenAPIHono();

authRoutes.post("/register", register);

export default authRoutes;
