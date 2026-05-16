import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello amisha!");
});

export default app;
