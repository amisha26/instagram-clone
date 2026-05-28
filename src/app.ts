import { Hono } from "hono";
import { errorHandler } from "./middleware/error.middleware";
import routes from "./routes/index";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello amisha!");
});

app.route("/", routes);

app.notFound((c) =>
	c.json(
		{
			success: false,
			message: "Route not found",
		},
		404,
	),
);

app.onError(errorHandler);

export default app;
