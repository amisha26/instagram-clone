import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

type ErrorResponse = {
	success: false;
	message: string;
	errors?: unknown;
};

export const sendError = (
	c: Context,
	status: ContentfulStatusCode,
	message: string,
	errors?: unknown,
) => {
	return c.json<ErrorResponse>(
		{
			success: false,
			message,
			errors,
		},
		status,
	);
};
