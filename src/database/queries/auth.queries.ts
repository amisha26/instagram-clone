import type { UUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { usersTable } from "../models/auth.models";

export type NewUser = {
	username: string;
	password: string;
	dob: string;
	email: string;
	bio?: string;
};

export const findUserByUsername = async (username: string) => {
	const user = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.username, username));

	return user;
};

export const insertUser = async (userData: NewUser) => {
	const passwordHash = await Bun.password.hash(userData.password);

	const [user] = await db
		.insert(usersTable)
		.values({
			username: userData.username,
			email: userData.email,
			passwordHash,
			dob: userData.dob,
			bio: userData.bio,
		})
		.returning();

	return user.id as UUID;
};
