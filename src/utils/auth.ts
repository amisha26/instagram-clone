import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { env } from "../config/env";
import { AppHttpError, Errors } from "../utils/error";

const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

const cookieOptions = {
	httpOnly: true,
	secure: false, // true in production with HTTPS
	sameSite: "strict" as const,
};

type JwtPayload = {
	sub: string;
};

export const generateAccessToken = async (userId: string): Promise<string> => {
	const exp = Math.floor(Date.now() / 1000) + Number(env.JWT_EXPIRE) * 60; // 15 minutes

	return await sign(
		{
			sub: userId,
			exp,
		},
		env.JWT_ACCESS_SECRET,
	);
};

export const generateRefreshToken = async (userId: string): Promise<string> => {
	const exp =
		Math.floor(Date.now() / 1000) +
		Number(env.JWT_REFRESH_EXPIRE) * 24 * 60 * 60;

	return await sign(
		{
			sub: userId,
			exp,
		},
		env.JWT_REFRESH_SECRET,
	);
};

export const generateTokens = async (userId: string) => {
	const [accessToken, refreshToken] = await Promise.all([
		generateAccessToken(userId),
		generateRefreshToken(userId),
	]);

	return {
		accessToken,
		refreshToken,
	};
};

export const setAccessTokenCookie = (c: Context, accessToken: string): void => {
	setCookie(c, ACCESS_TOKEN_COOKIE, accessToken, {
		...cookieOptions,
		maxAge: Number(env.JWT_COOKIE_EXPIRES) * 60, // minutes -> seconds
	});
};

export const setRefreshTokenCookie = (
	c: Context,
	refreshToken: string,
): void => {
	setCookie(c, REFRESH_TOKEN_COOKIE, refreshToken, {
		...cookieOptions,
		maxAge: Number(env.JWT_REFRESH_COOKIE_EXPIRE) * 24 * 60 * 60, // days -> seconds
	});
};

export const setAuthCookies = (
	c: Context,
	accessToken: string,
	refreshToken: string,
): void => {
	setAccessTokenCookie(c, accessToken);
	setRefreshTokenCookie(c, refreshToken);
};

export const clearAuthCookies = (c: Context): void => {
	deleteCookie(c, ACCESS_TOKEN_COOKIE, {
		path: "/",
	});

	deleteCookie(c, REFRESH_TOKEN_COOKIE, {
		path: "/api/auth/refresh",
	});
};

export const getUserIdFromCookie = async (c: Context): Promise<string> => {
	const token = getCookie(c, ACCESS_TOKEN_COOKIE);

	if (!token) {
		throw new AppHttpError(Errors.NO_TOKEN.message, Errors.NO_TOKEN.status);
	}

	try {
		const decoded = await verify(token, env.JWT_ACCESS_SECRET, "HS256");

		return (decoded as JwtPayload).sub;
	} catch {
		throw new AppHttpError(
			Errors.INVALID_TOKEN.message,
			Errors.INVALID_TOKEN.status,
		);
	}
};
