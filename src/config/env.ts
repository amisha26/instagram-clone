const getEnvVariable = (key: string): string => {
	const value = Bun.env[key];

	if (!value) {
		throw new Error(`Missing environment variable: ${key}`);
	}

	return value;
};

const NODE_ENV = Bun.env.NODE_ENV;
console.log("Current Environment:", NODE_ENV);

export const env = {
	PORT: Number(Bun.env.PORT) || 3000,

	DATABASE_URL: getEnvVariable("DATABASE_URL"),

	ADMIN_DB_URL: Bun.env.ADMIN_DB_URL,

	POSTGRES_PASSWORD: getEnvVariable("POSTGRES_PASSWORD"),

	POSTGRES_USER: getEnvVariable("POSTGRES_USER"),

	POSTGRES_DB: getEnvVariable("POSTGRES_DB"),

	OTP_EXPIRATION_MINUTES: Number(Bun.env.OTP_EXPIRATION_MINUTES) || 5,

	OTP_LENGTH: Number(Bun.env.OTP_LENGTH) || 5,

	ZOHO_MAIL_FROM_NAME: Bun.env.ZOHO_MAIL_FROM_NAME,

	ZOHO_FROM_EMAIL: Bun.env.ZOHO_FROM_EMAIL,

	ZOHO_MAIL_TOKEN: Bun.env.ZOHO_MAIL_TOKEN,
};
