// src/index.ts
import app from "./app";
import { env } from "./config/env";

Bun.serve({
	port: env.PORT,
	fetch: app.fetch,
});

console.log(`🚀 Server is running on port ${env.PORT}`);
