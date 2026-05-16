import { sql } from "drizzle-orm";
import {
	check,
	date,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable(
	"users",
	{
		id: uuid().primaryKey().defaultRandom(),
		username: varchar().notNull(),
		dob: date().notNull(),
		email: varchar({ length: 256 }).notNull().unique(),
		bio: varchar({ length: 500 }),
		passwordHash: varchar("password_hash", { length: 500 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		check("age_check", sql`DATE_PART('year', AGE(${table.dob})) >= 18`),
	],
);
