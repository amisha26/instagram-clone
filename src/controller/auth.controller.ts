import { eq, or } from "drizzle-orm";
import type { Context } from "hono";
import { db } from "../database/db";
import { usersTable } from "../database/models/auth.models";
import {
	getValidatedData,
	type ValidatedData,
} from "../middleware/validate.middleware";
import { AppHttpError, Errors } from "../utils/error";
import { sendErrorWithLog } from "../utils/helper";
import { sendSuccessResponse } from "../utils/validations";
import type { registerUserSchema } from "../validation/auth.validation";

/** Register a new user */
export const register = async (c: Context) => {
	try {
		const { username, email, password, dob, bio } =
			getValidatedData<ValidatedData<typeof registerUserSchema>>(c);
		const existingUser = await db
			.select()
			.from(usersTable)
			.where(
				or(eq(usersTable.username, username), eq(usersTable.email, email)),
			);
		if (existingUser.length !== 0) {
			throw new AppHttpError(
				Errors.DUPLICATE_USER.message,
				Errors.DUPLICATE_USER.status,
			);
		}

		const passwordHash = await Bun.password.hash(password);

		const createdUser = await db.transaction(async (tx) => {
			const [user] = await tx
				.insert(usersTable)
				.values({
					username: username,
					email: email,
					passwordHash,
					dob: dob,
					bio: bio,
				})
				.returning();

			return user;
		});

		return sendSuccessResponse(
			c,
			"User registered successfully",
			createdUser,
			201,
		);
	} catch (error) {
		if (error instanceof AppHttpError) {
			throw error;
		}

		return sendErrorWithLog(
			c,
			Errors.USER_CREATION_FAILED.status,
			Errors.USER_CREATION_FAILED.message,
			error instanceof Error
				? error.message
				: "Registration failed due to an unexpected error.",
			undefined,
			{ path: c.req.path },
		);
	}
};
