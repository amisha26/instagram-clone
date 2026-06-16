import { OpenAPIHono } from "@hono/zod-openapi";
import { register, resendOTP, verifyUser } from "../controller/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { registerUserSchema, verifyOTP } from "../validation/auth.validation";

const authRoutes = new OpenAPIHono();

authRoutes.post("/register", validate(registerUserSchema), register);
authRoutes.post("/verify-user", validate(verifyOTP), verifyUser);
authRoutes.post("/resend-otp", resendOTP);

export default authRoutes;
