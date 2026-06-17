import { defineConfig } from "drizzle-kit";
import { env } from "./env";

export default defineConfig({
	out: "./src/database/drizzle",
	dialect: "postgresql",
	schema: "./src/database/models/auth.models.ts",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
});
