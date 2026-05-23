import type { Context, Next } from "hono";
import type { ZodSchema } from "zod";
import { Errors } from "../utils/error";
import { sendError } from "../utils/helper";

export const validate =
	(schema: ZodSchema) => async (c: Context, next: Next) => {
		const body = await c.req.json();

		const result = schema.safeParse(body);
		if (!result.success) {
			return sendError(
				c,
				Errors.VALIDATION_FAILED.status,
				Errors.VALIDATION_FAILED.message,
				result.error.flatten(),
			);
		}

		c.set("validatedData", result.data);

		await next();
	};
