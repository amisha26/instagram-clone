import type { Context } from "hono";

export const register = async (c: Context) => {
	const body = await c.req.json();

	return c.json({ message: "registered", body });
};
