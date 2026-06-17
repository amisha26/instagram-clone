import { desc, eq, or } from "drizzle-orm";
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
import {
	generateAccessToken,
	getUserIdFromCookie,
	setAccessTokenCookie,
} from "../utils/auth";
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
			if (existingUser.some((user) => user.isVerified === false)) {
				// if there is an existing user with pending verification, then ask user to verify email
				throw new AppHttpError(
					Errors.UNVERIFIED_USER.message,
					Errors.UNVERIFIED_USER.status,
				);
			}
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
					username,
					email,
					passwordHash,
					dob,
					isVerified: false,
					bio,
				})
				.returning();

			await tx.insert(otpVerificationTable).values({
				userId: user.id,
				otp: hashedOTP,
				expiresAt,
			});

			return user;
		});

		// Create access token
		const accessToken = await generateAccessToken(createdUser.id);

		// Set token in cookie
		setAccessTokenCookie(c, accessToken);

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
			{
				userId: createdUser.id,
				email: createdUser.email,
				username: createdUser.username,
			},
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
		const userId = await getUserIdFromCookie(c);
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
			.where(eq(otpVerificationTable.userId, userId))
			.orderBy(desc(otpVerificationTable.expiresAt))
			.limit(1);

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

export const resendOTP = async (c: Context) => {
	try {
		const userId = await getUserIdFromCookie(c);
		const user = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.id, userId));

		const { otp, hashedOTP, expiresAt } = await OTPService.generateOTP();

		await db
			.update(otpVerificationTable)
			.set({ otp: hashedOTP, expiresAt: expiresAt })
			.where(eq(otpVerificationTable.userId, userId));

		// Send OTP to user's email
		await sendEmail({
			c,
			toEmail: user[0].email,
			toName: user[0].username,
			subject: "Verify Your Email Address",
			html: getOtpTemplate(otp, user[0].username),
		});

		return sendSuccessResponse(
			c,
			"Verify otp sent on email to complete registration.",
			{
				userId: user[0].id,
				email: user[0].email,
				username: user[0].username,
			},
			201,
		);
	} catch (error) {
		if (error instanceof AppHttpError) {
			throw error;
		}

		return sendErrorWithLog(
			c,
			500,
			"Failed to resend OTP",
			error instanceof Error
				? error.message
				: "Failed to resend OTP due to an unexpected error",
			undefined,
			{ path: c.req.path },
		);
	}
};
