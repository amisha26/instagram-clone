import { z } from "@hono/zod-openapi";

export const registerUserSchema = z
	.object({
		username: z.string().min(3).max(30),
		email: z.string().email(),
		password: z.string().min(6),
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
		bio: z.string().max(500).optional(),
	})
	.openapi("RegisterUser");

export const loginUserSchema = z
	.object({
		username: z.string().min(3).max(30),
		password: z.string().min(6),
	})
	.openapi("LoginUser");
