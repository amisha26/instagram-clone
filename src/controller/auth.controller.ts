import { eq, or } from "drizzle-orm";
import type { Context } from "hono";
import { db } from "../database/db";
import {
	otpVerificationTable,
	usersTable,
} from "../database/models/auth.models";
import {
	getValidatedData,
	type ValidatedData,
} from "../middleware/validate.middleware";
import { sendEmail } from "../services/email/email.services";
import { getOtpTemplate } from "../services/email/template/otp.template";
import OTPService from "../services/otp/2fa.otp.services";
import { AppHttpError, Errors } from "../utils/error";
import { sendErrorWithLog } from "../utils/helper";
import { sendSuccessResponse } from "../utils/validations";
import type {
	registerUserSchema,
	verifyOTP,
} from "../validation/auth.validation";

/** Register a new user */
export const register = async (c: Context) => {
	try {
		const { username, email, password, dob, bio } =
			getValidatedData<ValidatedData<typeof registerUserSchema>>(c);
		const existingUser = await db
			.select()
			.from(usersTable)
			.where(
				or(eq(usersTable.username, username), eq(usersTable.email, email)),
			);
		if (existingUser.length !== 0) {
			throw new AppHttpError(
				Errors.DUPLICATE_USER.message,
				Errors.DUPLICATE_USER.status,
			);
		}

		// Generate OTP
		const { otp, hashedOTP, expiresAt } = await OTPService.generateOTP();

		const passwordHash = await Bun.password.hash(password);

		const createdUser = await db.transaction(async (tx) => {
			const [user] = await tx
				.insert(usersTable)
				.values({
					username: username,
					email: email,
					passwordHash,
					dob: dob,
					isVerified: false,
					bio: bio,
				})
				.returning();

			return user;
		});

		// Create otp verification table record
		await db.transaction(async (tx) => {
			await tx
				.insert(otpVerificationTable)
				.values({
					userId: createdUser.id,
					otp: hashedOTP,
					expiresAt: expiresAt,
				})
				.returning();
		});

		// Send OTP to user's email
		await sendEmail({
			c,
			toEmail: createdUser.email,
			toName: createdUser.username,
			subject: "Verify Your Email Address",
			html: getOtpTemplate(otp, createdUser.username),
		});

		return sendSuccessResponse(
			c,
			"Verify otp sent on email to complete registration.",
			createdUser,
			201,
		);
	} catch (error) {
		if (error instanceof AppHttpError) {
			throw error;
		}

		return sendErrorWithLog(
			c,
			Errors.USER_CREATION_FAILED.status,
			Errors.USER_CREATION_FAILED.message,
			error instanceof Error
				? error.message
				: "Registration failed due to an unexpected error.",
			undefined,
			{ path: c.req.path },
		);
	}
};

export const verifyUser = async (c: Context) => {
	try {
		const { otp } = getValidatedData<ValidatedData<typeof verifyOTP>>(c);
		const userId = c.req.param("userId");

		if (!userId) {
			throw new AppHttpError(
				Errors.UNAUTHORIZED.message,
				Errors.UNAUTHORIZED.status,
			);
		}

		// Fetch OTP verification record
		const otpRecords = await db
			.select()
			.from(otpVerificationTable)
			.where(eq(otpVerificationTable.userId, userId));

		if (otpRecords.length === 0) {
			throw new AppHttpError("Invalid OTP or user not found", 400);
		}

		const record = otpRecords[0];

		// Check if OTP is expired
		if (new Date() > new Date(record.expiresAt)) {
			throw new AppHttpError("OTP has expired", 410);
		}

		// Verify OTP
		const isOTPValid = await OTPService.verifyOTP(otp, record.otp);

		if (!isOTPValid) {
			throw new AppHttpError("Invalid OTP", 401);
		}

		// Update user's isVerified flag
		await db
			.update(usersTable)
			.set({ isVerified: true })
			.where(eq(usersTable.id, userId));

		// Delete OTP verification record
		await db
			.delete(otpVerificationTable)
			.where(eq(otpVerificationTable.userId, userId));

		return sendSuccessResponse(
			c,
			"Email verified successfully",
			{ userId },
			200,
		);
	} catch (error) {
		if (error instanceof AppHttpError) {
			throw error;
		}

		return sendErrorWithLog(
			c,
			Errors.USER_CREATION_FAILED.status,
			Errors.USER_CREATION_FAILED.message,
			error instanceof Error
				? error.message
				: "OTP verification failed due to an unexpected error.",
			undefined,
			{ path: c.req.path },
		);
	}
};
