import { z } from "@hono/zod-openapi";

export const registerUserSchema = z
	.object({
		username: z.string().min(3).max(30).openapi({
			example: "john_doe",
		}),

		email: z.string().email().openapi({
			example: "john@example.com",
		}),

		password: z.string().min(6).openapi({
			example: "password123",
		}),

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
			)
			.openapi({
				example: "2000-01-01",
			}),

		bio: z.string().max(500).optional().openapi({
			example: "hello i love coding",
		}),
	})
	.openapi("RegisterUser");
