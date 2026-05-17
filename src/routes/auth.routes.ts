import { OpenAPIHono } from "@hono/zod-openapi";
import { register } from "../controller/auth.controller";

const app = new OpenAPIHono();

app.post("/register", register);
