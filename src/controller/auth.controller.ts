import { eq, or } from "drizzle-orm";
import type { Context } from "hono";
import { db } from "../database/db";
import { usersTable } from "../database/models/auth.models";
import { AppHttpError, Errors } from "../utils/error";
import { sendErrorWithLog } from "../utils/helper";
import { sendSuccessResponse } from "../utils/validations";

/** Register a new user */
export const register = async (c: Context) => {
	try {
		const { username, email, password, dob, bio } = c.get("validatedData");
		const existingUser = await db
			.select()
			.from(usersTable)
			.where(
				or(eq(usersTable.username, username), eq(usersTable.email, email)),
			);
		if (existingUser.length !== 0) {
			throw new AppHttpError(
				Errors.DUPLICATE_RECORD.message,
				Errors.DUPLICATE_RECORD.status,
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
			{ id: createdUser },
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
