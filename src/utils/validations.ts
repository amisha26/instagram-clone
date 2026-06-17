import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

type SuccessResponse<T> = {
	success: true;
	message: string;
	data?: T;
};

type ErrorResponse = {
	success: false;
	message: string;
	errors?: unknown;
};

/** Sends a standardized success JSON response. */
export const sendSuccessResponse = <T>(
	c: Context,
	message: string,
	data?: T,
	status: ContentfulStatusCode = 200,
) => {
	return c.json<SuccessResponse<T>>(
		{
			success: true,
			message,
			data,
		},
		status,
	);
};

/** Sends a standardized error JSON response. */
export const sendErrorResponse = (
	c: Context,
	message: string,
	errors?: unknown,
	status: ContentfulStatusCode = 400,
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
