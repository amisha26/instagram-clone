import { sql } from "drizzle-orm";
import {
	boolean,
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
		id: uuid("id").primaryKey().defaultRandom(),
		username: varchar("username").notNull(),
		dob: date("dob").notNull(),
		email: varchar("email", { length: 256 }).notNull().unique(),
		bio: varchar("bio", { length: 500 }),
		passwordHash: varchar("password_hash", { length: 500 }).notNull(),
		isVerified: boolean("is_verified").default(false).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		check("age_check", sql`DATE_PART('year', AGE(${table.dob})) >= 18`),
	],
);

export const otpVerificationTable = pgTable("otp_verification_table", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	otp: varchar("otp").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
