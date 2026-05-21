import { eq, or } from "drizzle-orm";
import type { Context } from "hono";
import { db } from "../database/db";
import { usersTable } from "../database/models/auth.models";
import { AppHttpError, Errors } from "../utils/error";
import { sendError } from "../utils/helper";
import { sendSuccessResponse } from "../utils/validations";
import { registerUserSchema } from "../validation/auth.validation";

/** Register a new user */
export const register = async (c: Context) => {
	try {
		const body = await c.req.json();
		const result = registerUserSchema.safeParse(body);

		if (!result.success) {
			return sendError(
				c,
				Errors.VALIDATION_FAILED.status,
				Errors.VALIDATION_FAILED.message,
				result.error.flatten(),
			);
		}

		const validatedUserData = result.data;
		const existingUser = await db
			.select()
			.from(usersTable)
			.where(
				or(
					eq(usersTable.username, validatedUserData.username),
					eq(usersTable.email, validatedUserData.email),
				),
			);
		if (existingUser.length !== 0) {
			throw new AppHttpError(
				Errors.DUPLICATE_RECORD.message,
				Errors.DUPLICATE_RECORD.status,
			);
		}

		const passwordHash = await Bun.password.hash(validatedUserData.password);

		const createdUser = await db.transaction(async (tx) => {
			const [user] = await tx
				.insert(usersTable)
				.values({
					username: validatedUserData.username,
					email: validatedUserData.email,
					passwordHash,
					dob: validatedUserData.dob,
					bio: validatedUserData.bio,
				})
				.returning();

			return user;
		});

		return sendSuccessResponse(
			c,
			"User registered successfully",
			{ id: createdUser },
			201,
		);
	} catch (error) {
		if (error instanceof AppHttpError) {
			throw error;
		}

		throw new AppHttpError(
			Errors.USER_CREATION_FAILED.message,
			Errors.USER_CREATION_FAILED.status,
		);
	}
};
