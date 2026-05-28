import type { Context, Next } from "hono";
import type { ZodSchema, z } from "zod";
import { Errors } from "../utils/error";
import { sendError } from "../utils/helper";

export type ValidatedData<T extends ZodSchema> = z.infer<T>;
export type ValidationSchemas = Partial<{
	body: ZodSchema;
	query: ZodSchema;
	params: ZodSchema;
	headers: ZodSchema;
}>;
export type ValidatedDataMap<T extends ValidationSchemas> = {
	[K in keyof T]: T[K] extends ZodSchema ? z.infer<T[K]> : never;
};

export const getValidatedData = <T>(c: Context): T =>
	c.get("validatedData") as T;

const parseBody = async (c: Context): Promise<unknown> => {
	try {
		return await c.req.json();
	} catch {
		return undefined;
	}
};

const isZodSchema = (value: unknown): value is ZodSchema =>
	typeof value === "object" && value !== null && "safeParse" in value;

export const validate =
	<T extends ZodSchema | ValidationSchemas>(schemaOrSchemas: T) =>
	async (c: Context, next: Next) => {
		const query = c.req.query();
		const params = c.req.param();
		const headers = c.req.header();
		const body = await parseBody(c);

		if (isZodSchema(schemaOrSchemas)) {
			const input =
				body && typeof body === "object" && !Array.isArray(body)
					? { ...query, ...params, ...headers, ...body }
					: { ...query, ...params, ...headers };

			const result = schemaOrSchemas.safeParse(input);
			if (!result.success) {
				return sendError(
					c,
					Errors.VALIDATION_FAILED.status,
					Errors.VALIDATION_FAILED.message,
					result.error.flatten(),
				);
			}

			c.set("validatedData", result.data);
			await next();
			return;
		}

		const schemas = schemaOrSchemas as ValidationSchemas;
		const validatedData = {} as ValidatedDataMap<typeof schemas>;

		if (schemas.body) {
			const result = schemas.body.safeParse(body);
			if (!result.success) {
				return sendError(
					c,
					Errors.VALIDATION_FAILED.status,
					Errors.VALIDATION_FAILED.message,
					result.error.flatten(),
				);
			}
			validatedData.body = result.data as ValidatedDataMap<
				typeof schemas
			>["body"];
		}

		if (schemas.query) {
			const result = schemas.query.safeParse(query);
			if (!result.success) {
				return sendError(
					c,
					Errors.VALIDATION_FAILED.status,
					Errors.VALIDATION_FAILED.message,
					result.error.flatten(),
				);
			}
			validatedData.query = result.data as ValidatedDataMap<
				typeof schemas
			>["query"];
		}

		if (schemas.params) {
			const result = schemas.params.safeParse(params);
			if (!result.success) {
				return sendError(
					c,
					Errors.VALIDATION_FAILED.status,
					Errors.VALIDATION_FAILED.message,
					result.error.flatten(),
				);
			}
			validatedData.params = result.data as ValidatedDataMap<
				typeof schemas
			>["params"];
		}

		if (schemas.headers) {
			const result = schemas.headers.safeParse(headers);
			if (!result.success) {
				return sendError(
					c,
					Errors.VALIDATION_FAILED.status,
					Errors.VALIDATION_FAILED.message,
					result.error.flatten(),
				);
			}
			validatedData.headers = result.data as ValidatedDataMap<
				typeof schemas
			>["headers"];
		}

		c.set("validatedData", validatedData);
		await next();
	};
