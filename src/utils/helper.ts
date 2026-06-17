import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { logger } from "./logger";

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

export const sendErrorWithLog = (
	c: Context,
	status: ContentfulStatusCode,
	message: string,
	technicalMessage: string,
	errors?: unknown,
	meta?: unknown,
) => {
	const payload = {
		technicalMessage,
		errors,
		...(meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {}),
	};

	logger.error(payload, "Technical Error");

	return sendError(c, status, message, errors);
};
