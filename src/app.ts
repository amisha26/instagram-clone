import { Hono } from "hono";
import routes from "./routes/index";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello amisha!");
});
app.route("/", routes);

export default app;
