import type { Context } from "hono";
import { SendMailClient } from "zeptomail";
import { env } from "../../config/env";
import { sendErrorWithLog } from "../../utils/helper";
import { logger } from "../../utils/logger";
import { sendSuccessResponse } from "../../utils/validations";

const { ZOHO_FROM_EMAIL, ZOHO_MAIL_FROM_NAME, ZOHO_MAIL_TOKEN } = env;

if (!ZOHO_FROM_EMAIL || !ZOHO_MAIL_FROM_NAME || !ZOHO_MAIL_TOKEN) {
	logger.error(
		{
			ZOHO_FROM_EMAIL,
			ZOHO_MAIL_FROM_NAME,
			ZOHO_MAIL_TOKEN,
		},
		"Missing Zoho Mail configuration",
	);
	throw new Error(
		"Zoho Mail configuration is incomplete. Please check environment variables.",
	);
}

const client = new SendMailClient({
	url: "https://api.zeptomail.in/v1.1/email",
	token: ZOHO_MAIL_TOKEN,
});

type SendEmailOptions = {
	c: Context;
	toEmail: string;
	toName?: string;
	subject: string;
	html: string;
};

export const sendEmail = async ({
	c,
	toEmail,
	toName,
	subject,
	html,
}: SendEmailOptions) => {
	try {
		const response = await client.sendMail({
			from: {
				address: ZOHO_FROM_EMAIL,
				name: ZOHO_MAIL_FROM_NAME,
			},
			to: [
				{
					email_address: {
						address: toEmail,
						name: toName || "User",
					},
				},
			],
			subject,
			htmlbody: html,
		});

		const messageId =
			response && typeof response === "object" && "message_id" in response
				? (response as { message_id?: string }).message_id
				: undefined;

		logger.info({ toEmail, subject, messageId }, "Email sent successfully");
		return sendSuccessResponse(c, "Email Sent Successfully", response, 201);
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: typeof error === "object"
					? JSON.stringify(error)
					: String(error);

		const errorPayload =
			error instanceof Error
				? { message: error.message, stack: error.stack }
				: error;

		logger.error(
			{ toEmail, subject, error: errorPayload },
			"Email sending failed",
		);

		return sendErrorWithLog(
			c,
			500,
			"Failed to send email",
			errorMessage,
			errorPayload,
		);
	}
};
