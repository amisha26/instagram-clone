import { OpenAPIHono } from "@hono/zod-openapi";
import { register } from "../controller/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { registerUserSchema } from "../validation/auth.validation";

const authRoutes = new OpenAPIHono();

authRoutes.post("/register", validate(registerUserSchema), register);

export default authRoutes;
