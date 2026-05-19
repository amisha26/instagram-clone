import type { Context } from "hono";
import {
	findUserByUsername,
	insertUser,
} from "../database/queries/auth.queries";
import { sendErrorResponse, sendSuccessResponse } from "../utils/validations";
import { registerUserSchema } from "../validation/auth.validation";

/** Register a new user */
export const register = async (c: Context) => {
	const body = await c.req.json();
	const result = registerUserSchema.safeParse(body);
	if (!result.success) {
		return sendErrorResponse(
			c,
			"Validation error",
			result.error.flatten(),
			400,
		);
	}

	const validatedUserData = result.data;
	const existingUser = await findUserByUsername(validatedUserData.username);
	if (existingUser.length !== 0) {
		return sendErrorResponse(
			c,
			"Username already exists",
			"Username is already taken, Login instead",
			400,
		);
	}

	const createdUserId = await insertUser(validatedUserData);
	return sendSuccessResponse(
		c,
		"User registered successfully",
		{ id: createdUserId },
		201,
	);
};
