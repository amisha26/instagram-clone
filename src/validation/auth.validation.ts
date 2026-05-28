import { z } from "@hono/zod-openapi";

export const registerUserSchema = z
	.object({
		username: z
			.string()
			.min(3, "Username must be at least 3 characters long")
			.max(30, "Username must be at most 30 characters long"),
		email: z.string().email("Email must be a valid email address"),
		password: z
			.string()
			.min(6, "Password must be at least 6 characters long")
			.max(100, "Password must be at most 100 characters long")
			.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
			.regex(/[a-z]/, "Password must contain at least one lowercase letter")
			.regex(/[0-9]/, "Password must contain at least one number")
			.regex(
				/[^A-Za-z0-9]/,
				"Password must contain at least one special character",
			),
		dob: z
			.string()
			.refine((val) => !Number.isNaN(Date.parse(val)), {
				message: "Invalid date format",
			})
			.refine(
				(val) => {
					const age =
						(Date.now() - new Date(val).getTime()) /
						(1000 * 60 * 60 * 24 * 365.25);

					return age >= 18;
				},
				{
					message: "You must be at least 18 years old to create an account",
				},
			),
		bio: z
			.string()
			.max(500, "Bio must be at most 500 characters long")
			.optional(),
	})
	.openapi("RegisterUser");

export const loginUserSchema = z
	.object({
		username: z.string(),
		password: z.string().min(6, "Password must be at least 6 characters long"),
	})
	.openapi("LoginUser");
