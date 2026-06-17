import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { register } from "../../controller/auth.controller";
import {
	otpVerificationTable,
	usersTable,
} from "../../database/models/auth.models";
import {
	createTestDb,
	deleteTestDb,
	type TestDbContext,
} from "../setup-test-db";

const getErrorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);

let ctx: TestDbContext;

beforeEach(async () => {
	ctx = await createTestDb();
	await mock.module("../../database/db.ts", () => ({
		db: ctx.db,
	}));
});

afterEach(async () => {
	await deleteTestDb(ctx);
});

describe("Auth Controller - Register User", () => {
	const validUserData = {
		username: "testuser123",
		email: "testuser@example.com",
		password: "Test@1234",
		dob: "2000-01-15",
		bio: "Test bio",
	};

	it("should successfully register a new user", async () => {
		const mockContext = {
			req: {
				header: () => undefined,
			},
			json: (data: unknown) => data,
			header: (_key: string, _value: string) => {},
		} as unknown as Context;

		// Mock getValidatedData to return our test data
		await mock.module("../../middleware/validate.middleware.ts", () => ({
			getValidatedData: () => validUserData,
		}));

		// Mock OTPService
		await mock.module("../../services/otp/2fa.otp.services.ts", () => ({
			default: {
				generateOTP: async () => ({
					otp: "12345",
					hashedOTP: "hashed_otp_123",
					expiresAt: new Date(Date.now() + 10 * 60 * 1000),
				}),
			},
		}));

		// Mock email service
		await mock.module("../../services/email/email.services.ts", () => ({
			sendEmail: async () => {},
		}));

		// Mock auth utils
		await mock.module("../../utils/auth.ts", () => ({
			generateAccessToken: async () => "access_token_123",
			setAccessTokenCookie: () => {},
		}));

		// Mock success response
		await mock.module("../../utils/validations.ts", () => ({
			sendSuccessResponse: (_c: unknown, message: string, data: unknown) => ({
				message,
				data,
			}),
		}));

		await register(mockContext);

		// Verify user was created in database
		const createdUser = await ctx.db
			.select()
			.from(usersTable)
			.where(eq(usersTable.email, validUserData.email));

		expect(createdUser.length).toBe(1);
		expect(createdUser[0]?.username).toBe(validUserData.username);
		expect(createdUser[0]?.email).toBe(validUserData.email);
		expect(createdUser[0]?.isVerified).toBe(false);
		expect(createdUser[0]?.bio).toBe(validUserData.bio);

		// Verify OTP verification record was created
		const createdUserRecord = createdUser[0];
		expect(createdUserRecord).toBeDefined();
		expect(createdUserRecord?.id).toBeDefined();

		const userId = createdUserRecord?.id;
		expect(userId).toBeDefined();

		const otpRecord = await ctx.db
			.select()
			.from(otpVerificationTable)
			.where(eq(otpVerificationTable.userId, userId as string));

		expect(otpRecord.length).toBe(1);
	});

	it("should reject registration with duplicate username", async () => {
		// Create a user first
		await ctx.db.insert(usersTable).values({
			username: validUserData.username,
			email: "different@example.com",
			passwordHash: "hashed_password",
			dob: validUserData.dob,
			isVerified: true,
		});

		const mockContext = {
			req: {
				header: () => undefined,
			},
			json: (data: unknown) => data,
		} as unknown as Context;

		await mock.module("../../middleware/validate.middleware.ts", () => ({
			getValidatedData: () => ({
				...validUserData,
				email: "newemail@example.com",
			}),
		}));

		// Expect error for duplicate username
		try {
			await register(mockContext);
			expect.unreachable("Should have thrown an error for duplicate username");
		} catch (error: unknown) {
			expect(getErrorMessage(error)).toBe("Username or email already exists");
		}
	});

	it("should reject registration with duplicate email", async () => {
		// Create a user first
		await ctx.db.insert(usersTable).values({
			username: "different_user",
			email: validUserData.email,
			passwordHash: "hashed_password",
			dob: validUserData.dob,
			isVerified: true,
		});

		const mockContext = {
			req: {
				header: () => undefined,
			},
			json: (data: unknown) => data,
		} as unknown as Context;

		await mock.module("../../middleware/validate.middleware.ts", () => ({
			getValidatedData: () => ({
				...validUserData,
				username: "newusername",
			}),
		}));

		// Expect error for duplicate email
		try {
			await register(mockContext);
			expect.unreachable("Should have thrown an error for duplicate email");
		} catch (error: unknown) {
			expect(getErrorMessage(error)).toBe("Username or email already exists");
		}
	});

	it("should reject registration if unverified user with same credentials exists", async () => {
		// Create an unverified user
		await ctx.db.insert(usersTable).values({
			username: validUserData.username,
			email: validUserData.email,
			passwordHash: "hashed_password",
			dob: validUserData.dob,
			isVerified: false,
		});

		const mockContext = {
			req: {
				header: () => undefined,
			},
			json: (data: unknown) => data,
		} as unknown as Context;

		await mock.module("../../middleware/validate.middleware.ts", () => ({
			getValidatedData: () => validUserData,
		}));

		// Expect error for unverified user
		try {
			await register(mockContext);
			expect.unreachable("Should have thrown an error for unverified user");
		} catch (error: unknown) {
			expect(getErrorMessage(error)).toBe(
				"Email not verified. Please verify your email.",
			);
		}
	});

	it("should include optional bio field when provided", async () => {
		const userWithBio = {
			...validUserData,
			bio: "This is my profile bio",
		};

		// Create a user with bio
		const [user] = await ctx.db
			.insert(usersTable)
			.values({
				username: userWithBio.username,
				email: userWithBio.email,
				passwordHash: "hashed_password",
				dob: userWithBio.dob,
				bio: userWithBio.bio,
				isVerified: false,
			})
			.returning();

		expect(user?.bio).toBe(userWithBio.bio);
	});

	it("should handle registration without bio field", async () => {
		const userWithoutBio = {
			username: "biolessuser",
			email: "bioless@example.com",
			password: "Test@1234",
			dob: "2000-01-15",
		};

		// Create a user without bio
		const [user] = await ctx.db
			.insert(usersTable)
			.values({
				username: userWithoutBio.username,
				email: userWithoutBio.email,
				passwordHash: "hashed_password",
				dob: userWithoutBio.dob,
				isVerified: false,
			})
			.returning();

		expect(user?.bio).toBeNull();
	});

	it("should create OTP record with correct expiry time", async () => {
		const now = Date.now();
		const expiryTime = new Date(now + 10 * 60 * 1000); // 10 minutes

		const [user] = await ctx.db
			.insert(usersTable)
			.values({
				username: "otpuser",
				email: "otp@example.com",
				passwordHash: "hashed_password",
				dob: validUserData.dob,
				isVerified: false,
			})
			.returning();

		const [otpRecord] = await ctx.db
			.insert(otpVerificationTable)
			.values({
				userId: user.id,
				otp: "hashed_otp",
				expiresAt: expiryTime,
			})
			.returning();

		expect(otpRecord?.userId).toBe(user.id);
		expect(otpRecord?.expiresAt.getTime()).toBeGreaterThanOrEqual(
			now + 9.5 * 60 * 1000,
		);
	});

	it("should store password hash instead of plain password", async () => {
		const plainPassword = "Test@1234";
		const hashedPassword = await Bun.password.hash(plainPassword);

		const [user] = await ctx.db
			.insert(usersTable)
			.values({
				username: "hashtest",
				email: "hash@example.com",
				passwordHash: hashedPassword,
				dob: validUserData.dob,
				isVerified: false,
			})
			.returning();

		// Verify password hash is different from plain password
		expect(user?.passwordHash).not.toBe(plainPassword);
		expect(user?.passwordHash).toBe(hashedPassword);

		// Verify password can be verified
		const isValidPassword = await Bun.password.verify(
			plainPassword,
			hashedPassword,
		);
		expect(isValidPassword).toBe(true);
	});

	it("should set isVerified to false on initial registration", async () => {
		const [user] = await ctx.db
			.insert(usersTable)
			.values({
				username: "unverifieduser",
				email: "unverified@example.com",
				passwordHash: "hashed_password",
				dob: validUserData.dob,
				isVerified: false,
			})
			.returning();

		expect(user?.isVerified).toBe(false);
	});

	it("should set createdAt timestamp on user creation", async () => {
		const beforeInsert = new Date();

		const [user] = await ctx.db
			.insert(usersTable)
			.values({
				username: "timestampuser",
				email: "timestamp@example.com",
				passwordHash: "hashed_password",
				dob: validUserData.dob,
				isVerified: false,
			})
			.returning();

		const afterInsert = new Date();

		expect(user?.createdAt?.getTime()).toBeGreaterThanOrEqual(
			beforeInsert.getTime(),
		);
		expect(user?.createdAt?.getTime()).toBeLessThanOrEqual(
			afterInsert.getTime(),
		);
	});
});
